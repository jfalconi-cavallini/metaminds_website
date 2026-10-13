import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  foreignParentUpdateSessionIds,
  ownedParentUpdateSessionIds,
  parseSessionIdList,
} from "./parentUpdateSessions.ts";

const sessions = [
  { id: 21, student_id: 1, tutor_id: 7 },
  { id: 22, student_id: 2, tutor_id: 7 },
  { id: 23, student_id: 1, tutor_id: 8 },
];

describe("parseSessionIdList", () => {
  it("treats a missing list as no sessions", () => {
    assert.deepEqual(parseSessionIdList(undefined), []);
    assert.deepEqual(parseSessionIdList(null), []);
  });

  it("accepts an array of integers", () => {
    assert.deepEqual(parseSessionIdList([21, 22]), [21, 22]);
  });

  it("rejects a non-array or a non-integer entry", () => {
    assert.equal(parseSessionIdList("21"), null);
    assert.equal(parseSessionIdList([21, 1.5]), null);
    assert.equal(parseSessionIdList([21, "22"]), null);
  });
});

describe("foreignParentUpdateSessionIds", () => {
  it("accepts sessions taught by this tutor to this student", () => {
    assert.deepEqual(foreignParentUpdateSessionIds([21], sessions, 1, 7), []);
  });

  it("rejects another student's session, another tutor's session, and an unknown id", () => {
    assert.deepEqual(foreignParentUpdateSessionIds([21, 22, 23, 99], sessions, 1, 7), [22, 23, 99]);
  });

  it("reports a repeated foreign id once", () => {
    assert.deepEqual(foreignParentUpdateSessionIds([22, 22], sessions, 1, 7), [22]);
  });
});

describe("ownedParentUpdateSessionIds", () => {
  it("keeps only this student's sessions with this tutor, in order, without duplicates", () => {
    assert.deepEqual(ownedParentUpdateSessionIds([22, 21, 21, 99, 23], sessions, 1, 7), [21]);
  });
});
