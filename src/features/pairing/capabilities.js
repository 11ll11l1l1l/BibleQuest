// V7 reuses bounded communication capabilities instead of creating a new pair chat system.
// Lesson-response sharing is implemented by the discipleship service/repository and remains
// item-scoped; generic pair-private messaging has no accepted backend/RLS contract.
export const PAIR_COMMUNICATION_CAPABILITIES = Object.freeze({
  lessonResponseSharing: true,
  directPairMessaging: false,
});
