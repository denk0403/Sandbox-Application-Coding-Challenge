export interface CourseInfo {
    classId: number;
    subject: String;
}

export enum PreReqType {
    AND = "and",
    OR = "or",
}

export type PreReqValue = CourseInfo | PreReq;

export interface PreReq {
    type: PreReqType;
    values: Array<PreReqValue>;
}

export interface Course extends CourseInfo {
    prereqs: PreReq;
}

export type CourseUID = string;

export interface CourseJSONResponse {
    courses: Course[];
}
