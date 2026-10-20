//src/app/api/course/[course_id]/route.js

import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { successResponse } from "@/lib/utils";
import {
  CourseError,
  courseUser,
  readCourse,
  serializeCourse,
  getCourseForUser,
  courseError,
} from "@/lib/course";

export async function GET(request, { params }) {
  try {
    const user = await courseUser(request);
    const { course_id } = await params;
    const db = await getDb();

    const course = await getCourseForUser(
      db,
      course_id,
      user
    );

    const result = serializeCourse(course, user);

    if (user.role === "teacher") {
      const ids = (course.studentIds || []).map(
        (id) => new ObjectId(id)
      );

      const students = await db
        .collection("users")
        .find(
          { _id: { $in: ids } },
          {
            projection: {
              _id: 1,
              username: 1,
              email: 1,
            },
          }
        )
        .toArray();

      result.enrolledStudents = students.map(
        (student) => ({
          id: student._id.toString(),
          username: student.username,
          email: student.email,
        })
      );
    }

    return successResponse({ course: result }, 200);
  } catch (error) {
    return courseError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await courseUser(request, "teacher");
    const { course_id } = await params;
    const db = await getDb();

    const existing = await getCourseForUser(
      db,
      course_id,
      user
    );

    const data = await readCourse(request);

    const updated = await db
      .collection("courses")
      .findOneAndUpdate(
        {
          _id: existing._id,
          teacherId: user.id,

          $expr: {
            $lte: [
              {
                $size: {
                  $ifNull: ["$studentIds", []],
                },
              },
              data.maxStudents,
            ],
          },
        },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

    if (!updated) {
      throw new CourseError(
        "Course changed or Max Student is below the enrolled count. Refresh and try again.",
        409
      );
    }

    return successResponse(
      { course: serializeCourse(updated, user) },
      200
    );
  } catch (error) {
    return courseError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await courseUser(request, "teacher");
    const { course_id } = await params;
    const db = await getDb();

    const course = await getCourseForUser(
      db,
      course_id,
      user
    );

    const result = await db
      .collection("courses")
      .deleteOne({
        _id: course._id,
        teacherId: user.id,

        $expr: {
          $eq: [
            {
              $size: {
                $ifNull: ["$studentIds", []],
              },
            },
            0,
          ],
        },
      });

    if (!result.deletedCount) {
      throw new CourseError(
        "Cannot delete: students have enrolled or the course has changed",
        409
      );
    }

    return successResponse(
      { message: "Course deleted" },
      200
    );
  } catch (error) {
    return courseError(error);
  }
}