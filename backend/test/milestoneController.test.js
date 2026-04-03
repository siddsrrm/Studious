const {
  addMilestone,
  editMilestone,
  deleteMilestone,
} = require("../controllers/milestoneController.js");

jest.mock("../models/StudyPlan");

const StudyPlan = require("../models/StudyPlan");

function mockReq(overrides = {}) {
  return {
    user: { id: "user123" },   // milestone controller uses req.user.id not req.user.userId
    body: {},
    params: { id: "plan123", msId: "ms123" },
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// helper to build a fake milestone with Mongoose-like .id() on the plan
function makeFakePlan(milestones = []) {
  milestones.id = jest.fn().mockImplementation((msId) =>
    milestones.find((m) => m._id === msId) || null
  );

  return {
    _id: "plan123",
    milestones,
    save: jest.fn().mockResolvedValue({}),
  };
}
describe("addMilestone", () => {
  beforeEach(() => jest.resetAllMocks());



  test("returns 400 when title is missing", async () => {
    const req = mockReq({ body: { targetPercent: 50 } });
    const res = mockRes();

    await addMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Title and targetPercent are required.",
    });
  });

  test("returns 400 when targetPercent is missing", async () => {
    const req = mockReq({ body: { title: "First milestone" } });
    const res = mockRes();

    await addMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Title and targetPercent are required.",
    });
  });

  test("returns 400 when targetPercent is 0", async () => {
    const req = mockReq({ body: { title: "First milestone", targetPercent: 0 } });
    const res = mockRes();

    await addMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "targetPercent must be between 1 and 100.",
    });
  });

  test("returns 400 when targetPercent is above 100", async () => {
    const req = mockReq({ body: { title: "First milestone", targetPercent: 101 } });
    const res = mockRes();

    await addMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "targetPercent must be between 1 and 100.",
    });
  });

  test("returns 400 when targetPercent is negative", async () => {
    const req = mockReq({ body: { title: "First milestone", targetPercent: -10 } });
    const res = mockRes();

    await addMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "targetPercent must be between 1 and 100.",
    });
  });



  test("returns 404 when study plan is not found", async () => {
    StudyPlan.findOne.mockResolvedValue(null);

    const req = mockReq({ body: { title: "First milestone", targetPercent: 50 } });
    const res = mockRes();

    await addMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Study plan not found." });
  });



 test("returns 201 with the new milestone on success", async () => {
  const newMilestone = { title: "First milestone", targetPercent: 50 };
  const milestones = [newMilestone];
  const fakePlan = makeFakePlan(milestones);
  StudyPlan.findOne.mockResolvedValue(fakePlan);

  const req = mockReq({ body: { title: "First milestone", targetPercent: 50 } });
  const res = mockRes();

  await addMilestone(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith({ milestone: newMilestone });
});

  test("calls StudyPlan.findOne with the correct plan id and user id", async () => {
  const fakePlan = makeFakePlan();
  StudyPlan.findOne.mockResolvedValue(fakePlan);

  const req = mockReq({ body: { title: "t", targetPercent: 50 } });
  const res = mockRes();

  await addMilestone(req, res);

  expect(StudyPlan.findOne).toHaveBeenCalledWith({ _id: "plan123", user: "user123" });
});

test("accepts targetPercent of exactly 100", async () => {
  const fakePlan = makeFakePlan();
  StudyPlan.findOne.mockResolvedValue(fakePlan);

  const req = mockReq({ body: { title: "t", targetPercent: 100 } });
  const res = mockRes();

  await addMilestone(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
});

  test("calls plan.save after pushing the milestone", async () => {
  const milestones = [];
  milestones.push = jest.fn().mockImplementation((ms) => {
    Array.prototype.push.call(milestones, ms);
  });
  milestones.id = jest.fn();

  const fakePlan = {
    _id: "plan123",
    milestones,
    save: jest.fn().mockResolvedValue({}),
  };
  StudyPlan.findOne.mockResolvedValue(fakePlan);

  const req = mockReq({ body: { title: "t", targetPercent: 50 } });
  const res = mockRes();

  await addMilestone(req, res);

  expect(fakePlan.save).toHaveBeenCalledTimes(1);
});


test("accepts targetPercent of exactly 1", async () => {
  const milestones = [];
  milestones.push = jest.fn().mockImplementation((ms) => {
    Array.prototype.push.call(milestones, ms);
  });
  milestones.id = jest.fn();

  const fakePlan = {
    _id: "plan123",
    milestones,
    save: jest.fn().mockResolvedValue({}),
  };
  StudyPlan.findOne.mockResolvedValue(fakePlan);

  const req = mockReq({ body: { title: "t", targetPercent: 1 } });
  const res = mockRes();

  await addMilestone(req, res);

  expect(res.status).toHaveBeenCalledWith(201);
});




  test("returns 500 when StudyPlan.findOne throws", async () => {
    StudyPlan.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ body: { title: "t", targetPercent: 50 } });
    const res = mockRes();

    await addMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to add milestone." });
  });
});


describe("editMilestone", () => {
  beforeEach(() => jest.resetAllMocks());


  test("returns 400 when targetPercent is 0", async () => {
    const req = mockReq({ body: { targetPercent: 0 } });
    const res = mockRes();

    await editMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "targetPercent must be between 1 and 100.",
    });
  });

  test("returns 400 when targetPercent is above 100", async () => {
    const req = mockReq({ body: { targetPercent: 101 } });
    const res = mockRes();

    await editMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "targetPercent must be between 1 and 100.",
    });
  });


  test("returns 404 when study plan is not found", async () => {
    StudyPlan.findOne.mockResolvedValue(null);

    const req = mockReq({ body: { title: "Updated" } });
    const res = mockRes();

    await editMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Study plan not found." });
  });

  test("returns 404 when milestone is not found on the plan", async () => {
    const fakePlan = makeFakePlan([]);  // no milestones, .id() returns null
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq({ body: { title: "Updated" } });
    const res = mockRes();

    await editMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Milestone not found." });
  });


  test("updates title only when only title is provided", async () => {
    const fakeMilestone = { _id: "ms123", title: "Old title", targetPercent: 50 };
    const fakePlan = makeFakePlan([fakeMilestone]);
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq({
      body: { title: "New title" },
      params: { id: "plan123", msId: "ms123" },
    });
    const res = mockRes();

    await editMilestone(req, res);

    expect(fakeMilestone.title).toBe("New title");
    expect(fakeMilestone.targetPercent).toBe(50); // unchanged
    expect(res.json).toHaveBeenCalledWith({ milestone: fakeMilestone });
  });

  test("updates targetPercent only when only targetPercent is provided", async () => {
    const fakeMilestone = { _id: "ms123", title: "Old title", targetPercent: 50 };
    const fakePlan = makeFakePlan([fakeMilestone]);
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq({
      body: { targetPercent: 75 },
      params: { id: "plan123", msId: "ms123" },
    });
    const res = mockRes();

    await editMilestone(req, res);

    expect(fakeMilestone.targetPercent).toBe(75);
    expect(fakeMilestone.title).toBe("Old title"); // unchanged
    expect(res.json).toHaveBeenCalledWith({ milestone: fakeMilestone });
  });

  test("updates both fields when both are provided", async () => {
    const fakeMilestone = { _id: "ms123", title: "Old title", targetPercent: 50 };
    const fakePlan = makeFakePlan([fakeMilestone]);
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq({
      body: { title: "New title", targetPercent: 75 },
      params: { id: "plan123", msId: "ms123" },
    });
    const res = mockRes();

    await editMilestone(req, res);

    expect(fakeMilestone.title).toBe("New title");
    expect(fakeMilestone.targetPercent).toBe(75);
  });

  test("calls plan.save after editing the milestone", async () => {
    const fakeMilestone = { _id: "ms123", title: "Old title", targetPercent: 50 };
    const fakePlan = makeFakePlan([fakeMilestone]);
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq({
      body: { title: "New title" },
      params: { id: "plan123", msId: "ms123" },
    });
    const res = mockRes();

    await editMilestone(req, res);

    expect(fakePlan.save).toHaveBeenCalledTimes(1);
  });
//db error

  test("returns 500 when StudyPlan.findOne throws", async () => {
    StudyPlan.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ body: { title: "New title" } });
    const res = mockRes();

    await editMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to update milestone." });
  });
});


describe("deleteMilestone", () => {
  beforeEach(() => jest.resetAllMocks());

  //not found

  test("returns 404 when study plan is not found", async () => {
    StudyPlan.findOne.mockResolvedValue(null);

    const req = mockReq();
    const res = mockRes();

    await deleteMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Study plan not found." });
  });

  test("returns 404 when milestone is not found on the plan", async () => {
    const fakePlan = makeFakePlan([]); // no milestones, .id() returns null
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq();
    const res = mockRes();

    await deleteMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Milestone not found." });
  });

//successful calls

  test("returns success message after deleting milestone", async () => {
    const fakeMilestone = {
      _id: "ms123",
      title: "To delete",
      targetPercent: 50,
      deleteOne: jest.fn(),
    };
    const fakePlan = makeFakePlan([fakeMilestone]);
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq();
    const res = mockRes();

    await deleteMilestone(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: "Milestone deleted." });
  });

  test("calls milestone.deleteOne before saving the plan", async () => {
    const fakeMilestone = {
      _id: "ms123",
      title: "To delete",
      targetPercent: 50,
      deleteOne: jest.fn(),
    };
    const fakePlan = makeFakePlan([fakeMilestone]);
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq();
    const res = mockRes();

    await deleteMilestone(req, res);

    expect(fakeMilestone.deleteOne).toHaveBeenCalledTimes(1);
    expect(fakePlan.save).toHaveBeenCalledTimes(1);
  });

  test("calls plan.save after deleting the milestone", async () => {
    const fakeMilestone = {
      _id: "ms123",
      title: "To delete",
      targetPercent: 50,
      deleteOne: jest.fn(),
    };
    const fakePlan = makeFakePlan([fakeMilestone]);
    StudyPlan.findOne.mockResolvedValue(fakePlan);

    const req = mockReq();
    const res = mockRes();

    await deleteMilestone(req, res);

    expect(fakePlan.save).toHaveBeenCalledTimes(1);
  });

//db error

  test("returns 500 when StudyPlan.findOne throws", async () => {
    StudyPlan.findOne.mockRejectedValue(new Error("DB error"));

    const req = mockReq();
    const res = mockRes();

    await deleteMilestone(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to delete milestone." });
  });
});