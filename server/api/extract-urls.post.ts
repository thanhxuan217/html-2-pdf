import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ExtractUrlsResponse } from '~/types'

export default defineEventHandler(async (event): Promise<ExtractUrlsResponse> => {
  try {
    const { url } = await readBody(event)
    
    if (!url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL is required'
      })
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid URL format'
      })
    }

    // Security check - only allow http/https
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only HTTP and HTTPS URLs are allowed'
      })
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    })

    const $ = cheerio.load(response.data)
    const baseUrl = new URL(url)
    const urls: Array<{ url: string, text: string, type: 'internal' | 'external' }> = []

    // Extract all links
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      let text = $(element).text().trim()
      
      // If no text, try to get from title or aria-label
      if (!text) {
        text = $(element).attr('title') || $(element).attr('aria-label') || href || 'Unknown'
      }

      if (href && href.length > 0) {
        try {
          let fullUrl: string
          let urlType: 'internal' | 'external' = 'internal'
          
          if (href.startsWith('http')) {
            fullUrl = href
            const linkUrl = new URL(href)
            urlType = linkUrl.hostname === baseUrl.hostname ? 'internal' : 'external'
          } else if (href.startsWith('//')) {
            fullUrl = baseUrl.protocol + href
            const linkUrl = new URL(fullUrl)
            urlType = linkUrl.hostname === baseUrl.hostname ? 'internal' : 'external'
          } else if (href.startsWith('/')) {
            fullUrl = baseUrl.origin + href
            urlType = 'internal'
          } else if (href.startsWith('#')) {
            // Skip anchor links
            return
          } else if (href.includes('mailto:') || href.includes('tel:') || href.includes('javascript:')) {
            // Skip non-page links
            return
          } else {
            // Relative URL
            fullUrl = new URL(href, url).href
            urlType = 'internal'
          }

          // Additional filtering
          const urlObj = new URL(fullUrl)
          
          // Skip common file extensions that aren't web pages
          const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.exe', '.dmg', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.mp4', '.mp3', '.avi']
          const hasFileExtension = fileExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))
          
          if (!hasFileExtension) {
            urls.push({ 
              url: fullUrl, 
              text: text.substring(0, 200), // Limit text length
              type: urlType 
            })
          }
        } catch (e) {
          // Skip invalid URLs
          console.warn('Invalid URL:', href, e)
        }
      }
    })

    // Remove duplicates and sort
    const uniqueUrls = urls
      .filter((item, index, self) => 
        index === self.findIndex(t => t.url === item.url)
      )
      .sort((a, b) => {
        // Sort internal links first, then by URL
        if (a.type !== b.type) {
          return a.type === 'internal' ? -1 : 1
        }
        return a.url.localeCompare(b.url)
      })

    return {
      urls: uniqueUrls,
      count: uniqueUrls.length
    }
  } catch (error: any) {
    console.error('Extract URLs error:', error.message)
    
    if (error.response?.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'URL not found'
      })
    } else if (error.response?.status === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied to URL'
      })
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Unable to connect to URL'
      })
    } else if (error.code === 'ECONNABORTED') {
      throw createError({
        statusCode: 408,
        statusMessage: 'Request timeout'
      })
    }
    
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.message || 'Failed to extract URLs'
    })
  }
})
