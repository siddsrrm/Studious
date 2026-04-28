const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "complete_5_tasks",
    name: "Getting Started",
    description: "Complete 5 assignments",
    badge: "5-assignments-completed.png"
  },
  {
    id: "complete_10_tasks",
    name: "On a Roll",
    description: "Complete 10 assignments",
    badge: "10-assignments-completed.png"
  },
  {
    id: "complete_50_tasks",
    name: "Halfway Hero",
    description: "Complete 50 assignments",
    badge: "50-assignments-completed.png"
  },
  {
    id: "complete_100_tasks",
    name: "Century Scholar",
    description: "Complete 100 assignments",
    badge: "100-assignments-completed.png"
  },
  {
    id: "first_friend",
    name: "First Friend",
    description: "Make your first friend",
    badge: "made-a-friend.png"
  },
  {
    id: "first_study_plan",
    name: "Planner",
    description: "Create your first study plan",
    badge: "made-a-study-plan.png"
  },
  {
    id: "joined_study_group",
    name: "Study Group",
    description: "Join a study group",
    badge: "joined-a-study-group.png"
  }
]

const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENT_DEFINITIONS.map(a => [a.id, a]))

module.exports = { ACHIEVEMENT_DEFINITIONS, ACHIEVEMENT_MAP }
