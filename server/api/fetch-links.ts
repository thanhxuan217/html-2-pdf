export default defineEventHandler(async (event) => {
    const body = await readBody(event)
  const pdfDownloader = new PDFDownloader(body.uri, "abc");
  const links = await pdfDownloader.getPageLinks();
  console.log(links)
  return links;
})
