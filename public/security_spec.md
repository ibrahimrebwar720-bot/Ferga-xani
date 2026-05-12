# Security Specification for Ferga App

## Data Invariants
- A user document can only be created by the authenticated user whose UID matches the document ID.
- Initial XP must be 0.
- Initial learnedLessons must be empty.
- Users can only write their own progress, but can read other users' public profile info (XP, name, photo).
- Email must match the authenticated user's email and is kept private via app logic.

## The Dirty Dozen Payloads
1. Create user with different UID: `uid='malicious', auth.uid='victim'` -> DENIED
2. Create user with starting XP 1000: `xp=1000` -> DENIED
3. Update another user's XP: `existing.uid='victim', auth.uid='attacker'` -> DENIED
4. Update XP with a string: `xp='lots'` -> DENIED
5. Update email to someone else's: `email='admin@ferga.com'` -> DENIED
6. Write a "shadow field" isVIP: `isVIP=true` -> DENIED (via hasOnly)
7. Create user with non-empty learnedLessons: `learnedLessons=['advanced']` -> DENIED
8. Delete user profile: `operation=delete` -> DENIED (profile deletion not allowed from client)
9. Anonymous user reading leaderboard: `auth=null` -> DENIED
10. Update XP and email simultaneously: `updatedKeys=['xp', 'email']` -> DENIED
11. Inject huge string into email: `email.size() > 256` -> DENIED
12. Use non-alphanumeric UID: `userId='../../passwd'` -> DENIED (via isValidId)

## Test Plan
- Test CRUD operations using Firebase Emulator (if available) or manual regression check against security rules logic.
- Verify all 12 attack vectors are blocked by the rule logic.
