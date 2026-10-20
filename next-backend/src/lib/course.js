import { ObjectId } from "mongodb";
import { getCurrentUser } from "./auth.js";
import {
  errorResponse,
  printExceptionLog,
} from "./utils.js";

export class CourseError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function courseUser(request, role) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new CourseError("Please log in", 401);
  }

  if (role && user.role !== role) {
    throw new CourseError(
      `Only ${role}s can perform this operation`,
      403
    );
  }

  return user;
}

export function validateCourse(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    throw new CourseError("Invalid course data");
  }

  const {
    name,
    duration,
    topics,
    price,
    maxStudents,
  } = body;

  const status = body.status ?? "Open";

  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 150
  ) {
    throw new CourseError(
      "Course name is required (maximum 150 characters)"
    );
  }

  if (!Number.isSafeInteger(duration) || duration < 1) {
    throw new CourseError(
      "Duration must be a positive whole number of days"
    );
  }

  if (
    !Array.isArray(topics) ||
    topics.length === 0 ||
    topics.some(
      (topic) =>
        typeof topic !== "string" ||
        !topic.trim() ||
        topic.trim().length > 150
    )
  ) {
    throw new CourseError(
      "Provide at least one non-empty topic (maximum 150 characters each)"
    );
  }

  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new CourseError(
      "Price must be a non-negative number"
    );
  }

  if (
    !Number.isSafeInteger(maxStudents) ||
    maxStudents < 1
  ) {
    throw new CourseError(
      "Max Student must be a positive whole number"
    );
  }

  if (!["Open", "Close", "Cancel"].includes(status)) {
    throw new CourseError(
      "Status must be Open, Close, or Cancel"
    );
  }

  return {
    name: name.trim(),
    duration,
    topics: [
      ...new Set(topics.map((topic) => topic.trim())),
    ],
    price,
    maxStudents,
    status,
  };
}

export async function readCourse(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    throw new CourseError("Invalid JSON body");
  }

  return validateCourse(body);
}

export function serializeCourse(course, user) {
  const ids = course.studentIds || [];

  return {
    id: course._id.toString(),
    name: course.name,
    duration: course.duration,
    topics: course.topics,
    price: course.price,
    maxStudents: course.maxStudents,
    status: course.status,
    teacherId: course.teacherId,
    teacherName: course.teacherName,
    enrolledCount: ids.length,
    availableSeats: Math.max(
      0,
      course.maxStudents - ids.length
    ),
    isEnrolled: ids.includes(user.id),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

export async function getCourseForUser(db, id, user) {
  if (!ObjectId.isValid(id)) {
    throw new CourseError("Invalid course ID");
  }

  const course = await db.collection("courses").findOne({
    _id: new ObjectId(id),
  });

  if (!course) {
    throw new CourseError("Course not found", 404);
  }

  if (
    user.role === "teacher" &&
    course.teacherId !== user.id
  ) {
    throw new CourseError(
      "You can access only your own courses",
      403
    );
  }

  if (
    user.role === "student" &&
    course.status === "Cancel"
  ) {
    throw new CourseError("Course not found", 404);
  }

  return course;
}

export function courseError(error) {
  if (error instanceof CourseError) {
    return errorResponse(error.message, error.status);
  }

  printExceptionLog("Course API", error);

  return errorResponse(
    "Unable to process the course request",
    500
  );
}