import { load } from "cheerio";

interface TripMetaDataResult {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
}

const getTripMetaData = async (url: string): Promise<TripMetaDataResult> => {
  const pageData = await fetch(url);
  const html = await pageData.text();
  const $ = load(html);

  const title = $('meta[property="og:title"]').attr("content");
  const description = $('meta[property="og:description"]').attr("content");
  const image = $('meta[property="og:image"]').attr("content");

  // Extract canonical URL - prefer rel="canonical" over og:url
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || $('meta[property="og:url"]').attr("content") || url; // Fallback to original URL if no canonical found

  let imageBase64;
  if (image) {
    const response = await fetch(image);
    const imageArrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type");
    imageBase64 = `data:${contentType};base64,${Buffer.from(imageArrayBuffer).toString("base64")}`;
  }

  return {
    title,
    description,
    image: imageBase64,
    canonicalUrl,
  };
};

export default getTripMetaData;
