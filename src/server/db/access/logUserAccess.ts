import axios from "axios";
import { Session } from "next-auth";
import * as UAParser from "ua-parser-js";
import { DeviceType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function logUserAccess(
  ip: string,
  userId: string,
  userAgentString: string
) {
  let city = "Unknown";
  let country = "Unknown";
  let deviceType: DeviceType = DeviceType.DESKTOP;
  let isIphone = false;
  let browser = "Unknown";
  let deviceModel = "Unknown";
  let deviceBrand = "Unknown";

  try {
    const geoResponse = await axios.get(`https://ipinfo.io/${ip}/geo`);
    const geoData = geoResponse.data;
    city = geoData.city || "Unknown";
    country = geoData.country || "Unknown";
  } catch (error) {
    console.error("Error fetching geolocation:", error);
  }

  const uaParser = new UAParser.UAParser(userAgentString);
  const uaResult = uaParser.getResult();

  browser = uaResult.browser.name || "Unknown";

  if (uaResult.device.type === "mobile") {
    deviceType = DeviceType.MOBILE;
  }

  deviceModel = uaResult.device.model || "Unknown";
  deviceBrand = uaResult.device.vendor || "Unknown";

  if (deviceModel === "iPhone" && deviceBrand === "Apple") {
    isIphone = true;
  }

  await prisma.accessLog.create({
    data: {
      userId: userId,
      ip: ip,
      city: city,
      browser: browser,
      deviceType: deviceType,
      isIphone: isIphone,
      deviceModel: deviceModel,
      deviceBrand: deviceBrand,
    },
  });
}
