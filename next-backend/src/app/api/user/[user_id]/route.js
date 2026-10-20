import { getCurrentUser } from "@/lib/auth";
import { errorResponse, successResponse, printExceptionLog } from "@/lib/utils";

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return errorResponse("Please log in", 401);
    const { user_id } = await params;
    if (user_id !== user.id) return errorResponse("You can access only your own profile", 403);
    const response = successResponse({ user }, 200);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    printExceptionLog("User profile by ID", error);
    return errorResponse("Unable to load user profile", 500);
  }
}
