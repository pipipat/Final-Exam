//src/app/api/course/route.js
import { getDb } from "@/lib/mongodb";
import { successResponse } from "@/lib/utils";
import {
  CourseError,
  courseUser,
  readCourse,
  serializeCourse,
  courseError,
} from "@/lib/course";

export async function GET(request) {
  try {
    const user = await courseUser(request);
    const db = await getDb();

    const filter =
      user.role === "teacher"
        ? { teacherId: user.id }
        : { status: { $ne: "Cancel" } };

    if (
      user.role === "student" &&
      request.nextUrl.searchParams.get("mine") === "true"
    ) {
      filter.studentIds = user.id;
    }

    const search = (
      request.nextUrl.searchParams.get("search") || ""
    ).trim();

    if (search.length > 150) {
      throw new CourseError("Search is too long");
    }

    if (search) {
      const pattern = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        {
          name: {
            $regex: pattern,
            $options: "i",
          },
        },
        {
          teacherName: {
            $regex: pattern,
            $options: "i",
          },
        },
      ];
    }

    const courses = await db
      .collection("courses")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return successResponse(
      {
        courses: courses.map((course) =>
          serializeCourse(course, user)
        ),
      },
      200
    );
  } catch (error) {
    return courseError(error);
  }
}

export async function POST(request) {
  try {
    const user = await courseUser(request, "teacher");
    const data = await readCourse(request);
    const db = await getDb();

    const now = new Date();

    const course = {
      ...data,
      teacherId: user.id,
      teacherName: user.username,
      studentIds: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("courses")
      .insertOne(course);

    course._id = result.insertedId;

    return successResponse(
      { course: serializeCourse(course, user) },
      201
    );
  } catch (error) {
    return courseError(error);
  }
}