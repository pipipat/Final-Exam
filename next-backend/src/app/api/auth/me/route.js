import { getCurrentUser } from "@/lib/auth";
import {
  errorResponse,
  successResponse,
  printExceptionLog,
} from "@/lib/utils";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return errorResponse("Please log in", 401);
    }

    const response = successResponse({ user }, 200);

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    printExceptionLog("Current user", error);

    return errorResponse(
      "Unable to load the current user",
      500
    );
  }
}