# 09: Live sync and failed saves

**What to build:** Changes I make on one device or tab show up on my other open devices or tabs within about a second, without reloading. This covers Tasks, Categories and settings. My own edits show on screen instantly, before the server confirms them. If a save fails, the screen goes back to what's really saved and shows a short message.

**Blocked by:** 05: Lines and adding Tasks.

**Status:** done

- [x] The Backend interface lets the app subscribe to remote changes to the user's Tasks, Categories and Settings; the Supabase backend uses Realtime, and the in-memory backend lets a test make a change as if from another device
- [x] Remote creates, updates and deletes are merged into the screen without reloading
- [x] All edits show on screen straight away; when the Backend rejects one, the change is undone on screen and a message appears
- [ ] Checked by hand: two browser windows on the deployed app stay in step
- [x] App-level tests cover a remote Task being added, edited and deleted, a remote Category rename, a remote settings change, and a rejected save reverting with a message
