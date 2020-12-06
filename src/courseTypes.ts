/** Represents a Course with some basic info. */
export interface CourseInfo {
    classId: number;
    subject: String;
}

/** Represents a type of prerequisite on a Course. */
export enum PreReqType {
    AND = "and",
    OR = "or",
}

/** Represents a value for a prerequisite, which can be a course or another prerequisite. */
export type PreReqValue = CourseInfo | PreReq;

/** Represents a whole prerequisite, including its type and list of prereq values. */
export interface PreReq {
    type: PreReqType;
    values: Array<PreReqValue>;
}

/** Represents a whole Course, which is like CourseInfo, but has prerequisites on it. */
export interface Course extends CourseInfo {
    prereqs: PreReq;
}

/** Represents a unique identifier for a course */
export type CourseUID = string;

/** Represents a JSON containing a property with a list of courses. */
export interface CourseJSONResponse {
    courses: Course[];
}
