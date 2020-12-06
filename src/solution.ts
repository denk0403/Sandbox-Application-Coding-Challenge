import {
    Course,
    CourseInfo,
    CourseJSONResponse,
    CourseUID,
    PreReq,
    PreReqType,
    PreReqValue,
} from "./courseTypes.js";
import { get, post } from "./https_helpers.js";

/** Unique submission URL. */
const COURSES_URL: string =
    "https://challenge.sandboxneu.com/s/PMRGIYLUMERDU6ZCMVWWC2LMEI5CEZDFNZXGS43LMF2HGNBTIBTW2YLJNQXGG33NEIWCEZDVMURDUMJWGA3TQMZVGU4TSLBCON2GCZ3FEI5CEURRJBQXEZBCPUWCE2DBONUCEORCIJXXEV2DKBBUSRKVGVYDOTLEGNYU6OB5EJ6Q====";

// Completes a GET request to the submission URL and parses the response into JSON.
/** The courses JSON object requested from the URL. */
const coursesJSONResponse: CourseJSONResponse = JSON.parse(await get(COURSES_URL));

/** The list of courses required by a major. */
const courses: Course[] = coursesJSONResponse.courses;

// Determines a major plan for the courses above.
/**
 * A list of courses, in one potential order, required to be taken in a major.
 * (null if no ordered solution is possible)
 */
const plan: Course[] | null = determineMajorPlan(courses);

// POST the appropriate result to the submission URL
// by checking whether there is a solution.
if (plan !== null) {
    // The determined plan was not null, thus a solution is possible.
    // POST that solution to the submission URL.
    await post(COURSES_URL, JSON.stringify({ plan: plan }));
} else {
    // The determined plan was null, thus a solution is not possible.
    // POST "no solution" to the submission URL.
    await post(COURSES_URL, "no solution");
}

// HELPER FUNCTIONS
/**
 * Determines a major plan from a given list of required courses by
 * iteratively finding courses with no remaining prereqs.
 * @param courses A list of required courses
 */
function determineMajorPlan(courses: Course[]): Course[] | null {
    /** The original number of courses. */
    const coursesAmount: number = courses.length;

    /**
     * Closure for checking if the given map of taken courses is the same
     * size as the original number of courses, i.e. all courses are taken.
     * @param takenCourses A map from course UIDs to courses representing taken courses
     */
    function areAllCoursesTaken(takenCourses: Map<CourseUID, Course>): boolean {
        return takenCourses.size === coursesAmount;
    }

    /**
     * A map from course UIDs to courses.
     * Values in this map represent taken/satisfied courses.
     */
    const takenCoursesMap: Map<CourseUID, Course> = new Map<CourseUID, Course>();

    /** Tracks whether a major plan is possible. */
    let solutionIsPossible = true;

    // Run loop while there are courses that haven't been
    // taken and a major plan is still possible.
    while (!areAllCoursesTaken(takenCoursesMap) && solutionIsPossible) {
        // Loop through remaining courses, filtering out any that can be taken
        // and adding them to the map of taken courses.
        const remainingCourses = courses.filter((course: Course) => {
            // If the current course has all its prerequisites satisfied,
            // add the course to the map of taken courses and update
            // the solution to still be possible.
            if (isPreReqSatisfied(course.prereqs, takenCoursesMap)) {
                /**
                 * A unique identifier for the current course.
                 * (Used for the key in the map of taken courses)
                 */
                const courseUID = getCourseUID(course);
                takenCoursesMap.set(courseUID, course);

                return false; // filters out current course since it is taken.
            } else {
                return true; // keeps current course since it cannot be taken.
            }
        });

        // A solution is possible as long as the number of remaining courses to be taken
        // decreases as prerequisites are completed.
        solutionIsPossible = remainingCourses.length < courses.length;
        // Updates the list of courses to only those remaining to be taken.
        courses = remainingCourses;
    }

    // Once the loop has exited, if a solution is still possible,
    // then all courses must have been added to the map of taken courses.
    if (solutionIsPossible) {
        // Return a list of the taken courses.
        // Note: Map values in JavaScript are ordered, hence
        // spread syntax is sufficient to reproduce the ordered list.
        return [...takenCoursesMap.values()];
    } else {
        // Return null if a major plan was not possible.
        return null;
    }
}

/**
 * Generates a UID for a given course info.
 * @param course A course info
 */
function getCourseUID(course: CourseInfo): string {
    // A course can be uniquely identified by its subject and classId.
    return `${course.subject}${course.classId}`;
}

/**
 * Checks whether a prereq has been satisfied from a given map of taken courses.
 * @param preReq A prerequisite
 * @param takenCoursesMap A map from course UIDs to courses representing taken courses
 */
function isPreReqSatisfied(preReq: PreReq, takenCoursesMap: Map<CourseUID, Course>): boolean {
    /**
     * Closure for checking if a prereq value has been taken.
     * @param prereqValue A prerequisite value
     */
    function checkPrereqValue(prereqValue: PreReqValue): boolean {
        return isPrereqValueTaken(prereqValue, takenCoursesMap);
    }

    // If the prereq type is an "and", then we must check that
    // every prereq value is satisfied.
    // If the prereq type is an "or", then we must check that
    // at least one (some) prereq value is satisfied.
    if (preReq.type === PreReqType.AND) {
        return preReq.values.every(checkPrereqValue);
    } else if (preReq.type === PreReqType.OR) {
        return preReq.values.some(checkPrereqValue);
    } else {
        throw new Error("Unexpected prereq structure.");
    }
}

/**
 * Checks whether a prereq value is satisfied from a given map of taken courses.
 * @param prereqValue A prerequisite value
 * @param takenCoursesMap A map from course UIDs to courses representing taken courses
 */
function isPrereqValueTaken(
    prereqValue: PreReqValue,
    takenCoursesMap: Map<CourseUID, Course>,
): boolean {
    // If the prereq value is a CourseInfo, check that it is
    // in the map of taken courses.
    // Otherwise, the value is another prereq, so check that
    // it is satisfied.
    if (isCourseInfo(prereqValue)) {
        return isCourseTaken(prereqValue, takenCoursesMap);
    } else {
        return isPreReqSatisfied(prereqValue, takenCoursesMap);
    }
}

/**
 * A type guard for determining if a given PreReqValue is a CourseInfo object.
 * @param prereqValue A prerequisite value
 */
function isCourseInfo(prereqValue: PreReqValue): prereqValue is CourseInfo {
    // Checks for CourseInfo properties on given prereq value to
    // determine if it is a CourseInfo.
    return "classId" in prereqValue && "subject" in prereqValue;
}

/**
 * Checks whether a course has been taken from a given map of taken courses.
 * @param course A course info
 * @param takenCoursesMap A map from course UIDs to courses representing taken courses
 */
function isCourseTaken(course: CourseInfo, takenCoursesMap: Map<CourseUID, Course>): boolean {
    // A course is taken if its UID is found as a key on the map of taken courses.
    return takenCoursesMap.has(getCourseUID(course));
}
