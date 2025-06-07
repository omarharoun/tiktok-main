# PocketBase Collection Permissions Fix

The app is working but getting 403 errors because PocketBase collections are set to "superuser only". Here's how to fix the permissions:

## 1. Access PocketBase Admin Panel

- Go to: http://164.92.139.226:8090/_/
- Login with your admin credentials

## 2. Update Collection Permissions

### Users Collection

**List/Search Rules:** `@request.auth.id != ""`
**View Rules:** `@request.auth.id != ""`
**Create Rules:** `@request.auth.id = ""`
**Update Rules:** `@request.auth.id = id`
**Delete Rules:** `@request.auth.id = id`

### Posts Collection

**List/Search Rules:** `@request.auth.id != ""`
**View Rules:** `@request.auth.id != ""`
**Create Rules:** `@request.auth.id != "" && @request.auth.id = user`
**Update Rules:** `@request.auth.id = user`
**Delete Rules:** `@request.auth.id = user`

### Comments Collection

**List/Search Rules:** `@request.auth.id != ""`
**View Rules:** `@request.auth.id != ""`
**Create Rules:** `@request.auth.id != "" && @request.auth.id = user`
**Update Rules:** `@request.auth.id = user`
**Delete Rules:** `@request.auth.id = user`

### Likes Collection

**List/Search Rules:** `@request.auth.id != ""`
**View Rules:** `@request.auth.id != ""`
**Create Rules:** `@request.auth.id != "" && @request.auth.id = user`
**Update Rules:** `@request.auth.id = user`
**Delete Rules:** `@request.auth.id = user`

### Following Collection

**List/Search Rules:** `@request.auth.id != ""`
**View Rules:** `@request.auth.id != ""`
**Create Rules:** `@request.auth.id != "" && @request.auth.id = follower`
**Update Rules:** `@request.auth.id = follower`
**Delete Rules:** `@request.auth.id = follower`

### Chats Collection

**List/Search Rules:** `@request.auth.id != "" && (@request.auth.id = user1 || @request.auth.id = user2)`
**View Rules:** `@request.auth.id != "" && (@request.auth.id = user1 || @request.auth.id = user2)`
**Create Rules:** `@request.auth.id != "" && (@request.auth.id = user1 || @request.auth.id = user2)`
**Update Rules:** `@request.auth.id = user1 || @request.auth.id = user2`
**Delete Rules:** `@request.auth.id = user1 || @request.auth.id = user2`

### Messages Collection

**List/Search Rules:** `@request.auth.id != "" && (@request.auth.id = sender || @request.auth.id = @collection.chats.user1 || @request.auth.id = @collection.chats.user2)`
**View Rules:** `@request.auth.id != "" && (@request.auth.id = sender || @request.auth.id = @collection.chats.user1 || @request.auth.id = @collection.chats.user2)`
**Create Rules:** `@request.auth.id != "" && @request.auth.id = sender`
**Update Rules:** `@request.auth.id = sender`
**Delete Rules:** `@request.auth.id = sender`

## 3. What These Rules Mean:

- `@request.auth.id != ""` - User must be authenticated
- `@request.auth.id = user` - User can only access their own records
- `@request.auth.id = follower` - User can only create/modify their own following records
- For chats: Users can only access chats they're part of (user1 or user2)
- For messages: Users can only access messages in chats they're part of

## 4. After Setting Permissions:

The app should work properly without 403 errors. Users will be able to:

- View and create posts
- Follow/unfollow other users
- Like posts and comments
- Send and receive chat messages
- View other users' public profiles
