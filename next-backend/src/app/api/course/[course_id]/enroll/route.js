import { getDb } from "@/lib/mongodb";
import { successResponse } from "@/lib/utils";
import {
  CourseError,
  courseUser,
  getCourseForUser,
  serializeCourse,
  courseError,
} from "@/lib/course";

export async function POST(request, { params }) {
  try {
    const user = await courseUser(request, "student");
    const { course_id } = await params;
    const db = await getDb();

    const course = await getCourseForUser(
      db,
      course_id,
      user
    );

    if ((course.studentIds || []).includes(user.id)) {
      throw new CourseError(
        "You are already enrolled in this course",
        409
      );
    }

    if (course.status !== "Open") {
      throw new CourseError(
        "Enrollment is available only for Open courses",
        409
      );
    }

    const updated = await db
      .collection("courses")
      .findOneAndUpdate(
        {
          _id: course._id,
          status: "Open",
          studentIds: { $ne: user.id },

          $expr: {
            $lt: [
              {
                $size: {
                  $ifNull: ["$studentIds", []],
                },
              },
              "$maxStudents",
            ],
          },
        },
        {
          $addToSet: {
            studentIds: user.id,
          },

          $set: {
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
        }
      );

    if (!updated) {
      throw new CourseError(
        "Enrollment failed: the course is full, no longer Open, already enrolled, or has changed. Refresh and try again.",
        409
      );
    }

    return successResponse(
      {
        message: "Enrolled successfully",
        course: serializeCourse(updated, user),
      },
      201
    );
  } catch (error) {
    return courseError(error);
  }
}