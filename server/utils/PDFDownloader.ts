import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import iconv from 'iconv-lite';
import charset from 'charset';

interface PageLink {
    id: number;
    url: string;
    title: string;
}

interface DownloadStats {
    successful: number;
    failed: number;
    total: number;
}


export default class PDFDownloader {
    private baseUrl: string;
    private outputDir: string;
    private httpClient: any;

    constructor(baseUrl: string, outputDir: string) {
        this.baseUrl = baseUrl;
        this.outputDir = outputDir;

        // Khởi tạo HTTP client với headers
        this.httpClient = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Charset': 'utf-8, gb2312, gbk' // Request multiple encodings
            },
            responseType: 'arraybuffer', // Fetch as binary buffer
            timeout: 30000
        });

        // Tạo thư mục output nếu chưa tồn tại
        this.ensureOutputDir();
    }

    private ensureOutputDir(): void {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log(`📁 Đã tạo thư mục: ${this.outputDir}`);
        }
    }

    private cleanFilename(filename: string): string {
        // Decode and normalize Unicode
        let decodedFilename = decodeURIComponent(filename).normalize('NFC');

        // Remove invalid characters
        let cleanName = decodedFilename
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
            .replace(/[·、,;！？]/g, '-')
            .replace(/\s+/g, '_')
            .replace(/[\u200B-\u200F\uFEFF]/g, '')
            .trim();

        return cleanName;
    }

    public async getPageLinks(): Promise<PageLink[]> {
        console.log('🔍 Đang lấy danh sách các trang...');

        const allUrls = new Set<string>();
        let idCounter = 1;

        const fetchPageLinks = async (url: string, depth: number = 0, maxDepth: number = 3): Promise<PageLink[]> => {
            // Giới hạn độ sâu để tránh vòng lặp vô tận
            if (depth > maxDepth) {
                return [];
            }

            // Tránh fetch lại URL đã xử lý
            if (allUrls.has(url)) {
                return [];
            }

            allUrls.add(url);
            console.log(`${'  '.repeat(depth)}🔍 Đang xử lý: ${url} (độ sâu: ${depth})`);

            try {
                const response = await this.httpClient.get(url);

                // Detect encoding from headers or HTML meta tags
                const encoding = charset(response.headers['content-type'], response.data) || 'gb2312';

                // Decode the response data
                const decodedData = iconv.decode(Buffer.from(response.data), encoding);

                // Load decoded data into cheerio
                const $ = cheerio.load(decodedData);

                const links: PageLink[] = [];
                const seenUrls = new Set<string>();

                $('a[href]').each((_: any, element: any) => {
                    const href = $(element).attr('href');
                    const text = $(element).text().trim();

                    // Lọc các link hợp lệ
                    if (href &&
                        text &&
                        text.length > 2 &&
                        !href.includes('#') &&
                        !href.includes('&action=edit')

                    ) { // Loại trừ link trang chính

                        const fullUrl = new URL(href, url).href;

                        // Tránh duplicate trong cùng một trang
                        if (!seenUrls.has(fullUrl)) {
                            seenUrls.add(fullUrl);

                            const pageLink: PageLink = {
                                id: idCounter++,
                                url: fullUrl,
                                title: text
                            };

                            links.push(pageLink);
                        }
                    }
                });

                console.log(`${'  '.repeat(depth)}✅ Tìm thấy ${links.length} link ở độ sâu ${depth}`);
                return links;

            } catch (error: any) {
                console.error(`${'  '.repeat(depth)}❌ Lỗi khi xử lý ${url}:`, error.message);
                return [];
            }
        };

        try {
            const rootLinks = await fetchPageLinks(this.baseUrl);

            // const totalLinks = this.countTotalLinks(rootLinks);
            // console.log(`🎉 Hoàn thành! Tổng cộng ${totalLinks} link được tìm thấy`);

            return rootLinks;

        } catch (error) {
            console.error('❌ Lỗi khi lấy danh sách link:', error);
            return [];
        }
    }

    // Helper method để đếm tổng số link
    // private countTotalLinks(links: PageLink[]): number {
    //     let count = links.length;
    //     for (const link of links) {
    //         count += this.countTotalLinks(link.children);
    //     }
    //     return count;
    // }


    private async downloadSinglePDF(index: number, linkInfo: PageLink): Promise<boolean> {
        const filename = `${index.toString().padStart(3, '0')}_${linkInfo.title}.pdf`;
        const filepath = path.join(this.outputDir, filename);

        // Kiểm tra nếu file đã tồn tại
        if (fs.existsSync(filepath)) {
            console.log(`⏭️  File đã tồn tại: ${filename}`);
            return true;
        }

        try {
            console.log(`📥 Đang tải (${index}): ${linkInfo.title}`);

            // Sử dụng Puppeteer để tạo PDF
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Thiết lập viewport và user agent
            await page.setViewport({ width: 1200, height: 800 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Điều hướng đến trang
            await page.goto(linkInfo.url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Tạo PDF
            await page.pdf({
                path: filepath,
                format: 'A4',
                margin: {
                    top: '0mm',
                    right: '0mm',
                    bottom: '0mm',
                    left: '0mm'
                },
                printBackground: true
            });

            await browser.close();

            console.log(`✅ Hoàn thành: ${filename}`);
            return true;

        } catch (error) {
            console.error(`❌ Lỗi khi tải '${linkInfo.title}':`, error);
            return false;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async downloadAll(): Promise<void> {
        console.log('🚀 Bắt đầu quá trình tải PDF...');
        console.log('='.repeat(50));

        // Lấy danh sách các link
        const links = await this.getPageLinks();

        if (links.length === 0) {
            console.log('❌ Không tìm thấy link nào để tải!');
            return;
        }

        console.log(`📋 Sẽ tải tổng cộng ${links.length} trang`);
        console.log('='.repeat(50));

        // Thống kê
        const stats: DownloadStats = {
            successful: 0,
            failed: 0,
            total: links.length
        };

        // Tải từng trang
        for (let i = 0; i < links.length; i++) {
            const linkInfo = links[i];
            console.log(linkInfo + "\n");
            // const success = await this.downloadSinglePDF(i + 1, linkInfo);

            // if (success) {
            //   stats.successful++;
            // } else {
            //   stats.failed++;
            // }

            // // Delay giữa các lần tải (trừ lần cuối)
            // if (i < links.length - 1) {
            //   // await this.delay(2000); // 3 giây
            // }
        }

        // In kết quả
        console.log('\n' + '='.repeat(50));
        console.log('🎉 HOÀN THÀNH!');
        console.log(`✅ Tải thành công: ${stats.successful} file`);
        console.log(`❌ Thất bại: ${stats.failed} file`);
        console.log(`📁 Thư mục lưu: ${path.resolve(this.outputDir)}`);
        console.log('='.repeat(50));
    }
}
