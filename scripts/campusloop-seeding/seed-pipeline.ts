/**
 * CampusLoop 500+ Content Seeding & Community Ignition Pipeline
 * 
 * Orchestrates the full creation and database insertion:
 * 1. Seed Personas (55 profiles across top campuses)
 * 2. Communities (36 interest-driven hubs) & Member Rosters
 * 3. Feed & Community Posts (300+ posts: Normal, Confessions, Questions, Polls, Memes)
 * 4. Post Upvotes & Interactions
 * 5. Poll Options & Student Votes
 * 6. Threaded Comments & Nested Replies (200+ comments)
 * 7. Academic Vault Resources (35 high-yield notes, PYQs, cheat sheets)
 * 8. Campus Events & Student Registrations (25 events)
 * 9. Active Campus Stories (30 stories with future expiration)
 * 10. Cryptographic Anonymity Sealing into anon_identity_vault
 * 
 * Run: bun run scripts/campusloop-seeding/seed-pipeline.ts
 */

import { eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "../../src/db";
import {
  academicResourceComments,
  academicResources,
  anonIdentityVault,
  comments,
  communities,
  communityMembers,
  eventRegistrations,
  events,
  institutions,
  pollOptions,
  pollVotes,
  posts,
  stories,
  userProfiles,
  votes,
} from "../../src/db/schema";
import { deriveAnonHandle, sealIdentity } from "../../src/lib/anonymity";
import { loadLocalEnv } from "../../src/lib/load-env";

import { ACADEMIC_RESOURCES } from "./academic-resources-data";
import { SEED_COMMENTS } from "./comments-data";
import { SEED_COMMUNITIES } from "./communities-data";
import { BATCH_ID, getStaggeredDate, KNOWN_INSTITUTIONS } from "./config";
import { SEED_EVENTS } from "./events-data";
import { SEED_PERSONAS } from "./personas";
import { ALL_POSTS } from "./posts-data";
import { SEED_STORIES } from "./stories-data";

loadLocalEnv();

async function runPipeline() {
  console.log("================================================================");
  console.log(`🚀 Starting CampusLoop Community Ignition Pipeline [${BATCH_ID}]`);
  console.log("================================================================\n");

  const db = getDb();

  // -------------------------------------------------------------
  // Step 0: Resolve Institution Mappings
  // -------------------------------------------------------------
  console.log("📍 Step 0: Resolving campus institutions...");
  const dbInstitutions = await db.select({ id: institutions.id, slug: institutions.slug }).from(institutions);
  const instMap = new Map<string, string>();

  for (const inst of dbInstitutions) {
    instMap.set(inst.slug.toLowerCase(), inst.id);
  }

  const flagshipId = instMap.get("bitmesra") || dbInstitutions[0]?.id;
  if (!flagshipId) {
    throw new Error("No institutions found in database! Please run db:seed first.");
  }

  function resolveInstId(key: string): string {
    if (KNOWN_INSTITUTIONS[key]) {
      return KNOWN_INSTITUTIONS[key];
    }
    return instMap.get(key.toLowerCase()) || flagshipId;
  }
  console.log(`✅ Loaded ${dbInstitutions.length} institutions. Flagship: ${flagshipId}\n`);

  // -------------------------------------------------------------
  // Step 1: Seed Personas (user_profiles)
  // -------------------------------------------------------------
  console.log(`👤 Step 1: Inserting ${SEED_PERSONAS.length} student personas...`);
  let insertedUsers = 0;

  for (const persona of SEED_PERSONAS) {
    const instId = resolveInstId(persona.institutionKey);
    const createdAt = getStaggeredDate(insertedUsers, SEED_PERSONAS.length, { daysAgo: 95 });

    await db
      .insert(userProfiles)
      .values({
        id: persona.id,
        userId: persona.userId,
        username: persona.username,
        displayName: persona.displayName,
        officialName: persona.officialName,
        email: persona.email,
        headline: persona.headline,
        institutionId: instId,
        course: persona.course,
        branch: persona.branch,
        year: persona.year,
        gender: persona.gender,
        bio: persona.bio,
        interests: persona.interests,
        photos: [persona.avatarUrl],
        onboardingCompleted: true,
        role: "STUDENT",
        status: "ACTIVE",
        points: persona.points,
        avatarUrl: persona.avatarUrl,
        bannerUrl: persona.bannerUrl,
        feedVisibility: "ALL",
        isSeeded: true, // Marked internally as seed persona
        lastSeenAt: new Date(),
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoUpdate({
        target: userProfiles.id,
        set: {
          headline: persona.headline,
          bio: persona.bio,
          points: persona.points,
          avatarUrl: persona.avatarUrl,
          bannerUrl: persona.bannerUrl,
          isSeeded: true,
        },
      });

    insertedUsers++;
  }
  console.log(`✅ ${insertedUsers} student personas verified in database.\n`);

  // -------------------------------------------------------------
  // Step 2: Seed Communities & Members
  // -------------------------------------------------------------
  console.log(`🏛️ Step 2: Creating ${SEED_COMMUNITIES.length} communities & rosters...`);
  const commIdMap = new Map<string, string>();
  let insertedCommunities = 0;
  let insertedMemberships = 0;

  for (const comm of SEED_COMMUNITIES) {
    const createdAt = getStaggeredDate(insertedCommunities, SEED_COMMUNITIES.length, { daysAgo: 85 });

    const existingComm = await db.query.communities.findFirst({
      where: or(eq(communities.name, comm.name), eq(communities.slug, comm.slug)),
    });

    const activeCommId = existingComm ? existingComm.id : comm.id;

    if (!existingComm) {
      await db
        .insert(communities)
        .values({
          id: comm.id,
          name: comm.name,
          slug: comm.slug,
          category: comm.category,
          description: comm.description,
          rules: JSON.stringify(comm.rules),
          allowAnonymousPosts: comm.allowAnonymousPosts,
          avatarUrl: comm.avatarUrl,
          bannerUrl: comm.bannerUrl,
          creatorId: comm.creatorId,
          points: comm.points,
          privacy: "PUBLIC",
          createdAt,
          updatedAt: createdAt,
        })
        .onConflictDoNothing();
    }

    commIdMap.set(comm.slug, activeCommId);
    insertedCommunities++;

    // Add 6-12 seed members to each community
    const memberCount = 8;
    for (let m = 0; m < memberCount; m++) {
      const userIndex = (insertedCommunities * 3 + m * 5) % SEED_PERSONAS.length;
      const memberUser = SEED_PERSONAS[userIndex];
      const memberId = `seed_202609_cmem_${comm.slug}_${memberUser.id}`;

      await db
        .insert(communityMembers)
        .values({
          id: memberId,
          communityId: activeCommId,
          userId: memberUser.id,
          role: m === 0 ? "ADMIN" : m === 1 ? "MODERATOR" : "MEMBER",
          status: "ACTIVE",
          createdAt,
        })
        .onConflictDoNothing();

      insertedMemberships++;
    }
  }
  console.log(`✅ ${insertedCommunities} communities created with ${insertedMemberships} active member records.\n`);

  // -------------------------------------------------------------
  // Step 3: Seed Posts & Anonymity Sealing
  // -------------------------------------------------------------
  console.log(`📝 Step 3: Publishing ${ALL_POSTS.length} posts (Normal, Confessions, Polls, Memes)...`);
  let insertedPosts = 0;
  let anonSealedCount = 0;
  let totalVotesCount = 0;
  let totalPollOptions = 0;
  let totalPollVotes = 0;

  for (let i = 0; i < ALL_POSTS.length; i++) {
    const postItem = ALL_POSTS[i];
    const authorPersona = SEED_PERSONAS[postItem.authorIndex % SEED_PERSONAS.length];
    const instId = resolveInstId(postItem.institutionKey);
    const commId = postItem.communitySlug ? commIdMap.get(postItem.communitySlug) || null : null;

    // Staggered timeline: spread over past 90 days, with recent posts from last 48h
    const isRecent = i >= ALL_POSTS.length - 20;
    const postDate = getStaggeredDate(i, ALL_POSTS.length, {
      isRecent,
      daysAgo: postItem.daysAgo,
    });

    let authorId: string | null = authorPersona.id;
    let pseudonym: string | null = null;
    const isAnon = Boolean(postItem.isAnonymous || postItem.type === "CONFESSION");

    if (isAnon) {
      authorId = null; // Enforce Rule 8: Anonymous posts carry no author_id in the DB
      pseudonym = deriveAnonHandle(authorPersona.id);

      // Cryptographically seal in anon_identity_vault
      await db
        .insert(anonIdentityVault)
        .values({
          id: `seed_202609_vault_${pseudonym}`,
          handle: pseudonym,
          sealedIdentity: sealIdentity(authorPersona.id),
          createdAt: postDate,
          updatedAt: postDate,
        })
        .onConflictDoNothing();

      anonSealedCount++;
    }

    await db
      .insert(posts)
      .values({
        id: postItem.id,
        authorId,
        pseudonym,
        institutionId: instId,
        type: postItem.type,
        scope: postItem.scope,
        title: postItem.title ?? null,
        body: postItem.body,
        isAnonymous: isAnon,
        status: "PUBLISHED",
        communityId: commId,
        isSeeded: false, // Set to false so the post is visible on the student feed
        createdAt: postDate,
        updatedAt: postDate,
      })
      .onConflictDoUpdate({
        target: posts.id,
        set: {
          title: postItem.title ?? null,
          body: postItem.body,
          status: "PUBLISHED",
          isSeeded: false,
        },
      });

    insertedPosts++;

    // Upvotes from rotating personas
    const voteTarget = Math.min(postItem.upvotes, SEED_PERSONAS.length - 1);
    const voteRows = [];
    for (let v = 0; v < voteTarget; v++) {
      const voter = SEED_PERSONAS[(i * 3 + v * 7 + 1) % SEED_PERSONAS.length];
      if (voter.id !== authorId) {
        voteRows.push({
          id: `seed_202609_vote_${postItem.id}_${voter.id}`,
          postId: postItem.id,
          userId: voter.id,
          value: 1,
          createdAt: new Date(postDate.getTime() + (v + 1) * 4 * 60 * 1000),
        });
      }
    }
    if (voteRows.length > 0) {
      await db.insert(votes).values(voteRows).onConflictDoNothing();
      totalVotesCount += voteRows.length;
    }

    // Poll options & distributed student votes
    if (postItem.type === "POLL" && postItem.pollOptions && postItem.pollOptions.length > 0) {
      const options = postItem.pollOptions;
      const distribution = postItem.pollVotesDistribution || options.map(() => 15);

      let voterCursor = 0;
      for (let o = 0; o < options.length; o++) {
        const optionId = `seed_202609_popt_${postItem.id}_${o}`;
        await db
          .insert(pollOptions)
          .values({
            id: optionId,
            postId: postItem.id,
            text: options[o],
            createdAt: postDate,
          })
          .onConflictDoNothing();
        totalPollOptions++;

        const targetVotes = distribution[o] || 10;
        const pVoteRows = [];
        for (let pv = 0; pv < targetVotes; pv++) {
          const pVoter = SEED_PERSONAS[(voterCursor * 5 + pv * 3 + 2) % SEED_PERSONAS.length];
          pVoteRows.push({
            id: `seed_202609_pvote_${postItem.id}_${o}_${pVoter.id}`,
            postId: postItem.id,
            optionId,
            userId: pVoter.id,
            createdAt: new Date(postDate.getTime() + (voterCursor + 1) * 3 * 60 * 1000),
          });
          voterCursor++;
        }
        if (pVoteRows.length > 0) {
          await db.insert(pollVotes).values(pVoteRows).onConflictDoNothing();
          totalPollVotes += pVoteRows.length;
        }
      }
    }
  }
  console.log(`✅ ${insertedPosts} posts published with ${totalVotesCount} upvotes.`);
  console.log(`✅ ${anonSealedCount} anonymous/confession identities cryptographically sealed.`);
  console.log(`✅ ${totalPollOptions} poll options created with ${totalPollVotes} votes.\n`);

  // -------------------------------------------------------------
  // Step 4: Seed Threaded Comments & Replies
  // -------------------------------------------------------------
  console.log(`💬 Step 4: Inserting threaded comments & nested replies...`);
  let topCommentsCount = 0;
  let nestedRepliesCount = 0;

  for (const cmItem of SEED_COMMENTS) {
    const postRecord = await db.query.posts.findFirst({
      where: eq(posts.id, cmItem.postId),
    });
    if (!postRecord) continue;

    const baseTime = postRecord.createdAt.getTime();
    const cmTime = new Date(baseTime + cmItem.minAfter * 60 * 1000);
    const authorUser = cmItem.authorIndex !== undefined ? SEED_PERSONAS[cmItem.authorIndex] : null;

    let cmAuthorId: string | null = authorUser ? authorUser.id : null;
    let cmPseudonym: string | null = null;
    if (cmItem.isAnonymous) {
      cmAuthorId = null;
      cmPseudonym = cmItem.pseudonym || `anon_student_${(topCommentsCount % 80) + 10}`;
    }

    await db
      .insert(comments)
      .values({
        id: cmItem.id,
        postId: cmItem.postId,
        authorId: cmAuthorId,
        pseudonym: cmPseudonym,
        parentId: null,
        body: cmItem.body,
        isAnonymous: Boolean(cmItem.isAnonymous),
        status: "PUBLISHED",
        createdAt: cmTime,
        updatedAt: cmTime,
      })
      .onConflictDoUpdate({
        target: comments.id,
        set: { body: cmItem.body },
      });

    topCommentsCount++;

    // Nested replies
    if (cmItem.replies && cmItem.replies.length > 0) {
      for (const rep of cmItem.replies) {
        const repTime = new Date(cmTime.getTime() + rep.minAfter * 60 * 1000);
        const repAuthor = rep.authorIndex !== undefined ? SEED_PERSONAS[rep.authorIndex] : null;
        let repAuthorId: string | null = repAuthor ? repAuthor.id : null;
        let repPseudonym: string | null = null;
        if (rep.isAnonymous) {
          repAuthorId = null;
          repPseudonym = rep.pseudonym || `anon_reply_${(nestedRepliesCount % 80) + 10}`;
        }

        await db
          .insert(comments)
          .values({
            id: rep.id,
            postId: cmItem.postId,
            authorId: repAuthorId,
            pseudonym: repPseudonym,
            parentId: cmItem.id,
            body: rep.body,
            isAnonymous: Boolean(rep.isAnonymous),
            status: "PUBLISHED",
            createdAt: repTime,
            updatedAt: repTime,
          })
          .onConflictDoUpdate({
            target: comments.id,
            set: { body: rep.body },
          });

        nestedRepliesCount++;
      }
    }
  }
  console.log(`✅ ${topCommentsCount} parent comments + ${nestedRepliesCount} nested replies published.\n`);

  // -------------------------------------------------------------
  // Step 5: Seed Academic Resources Vault
  // -------------------------------------------------------------
  console.log(`📚 Step 5: Populating Academic Resources Vault (${ACADEMIC_RESOURCES.length} items)...`);
  let insertedResources = 0;
  let insertedResourceComments = 0;

  for (let r = 0; r < ACADEMIC_RESOURCES.length; r++) {
    const resItem = ACADEMIC_RESOURCES[r];
    const uploader = SEED_PERSONAS[resItem.uploaderIndex % SEED_PERSONAS.length];
    const instId = resolveInstId(resItem.institutionKey);
    const resDate = getStaggeredDate(r, ACADEMIC_RESOURCES.length, { daysAgo: 60 });

    await db
      .insert(academicResources)
      .values({
        id: resItem.id,
        institutionId: instId,
        uploaderId: uploader.id,
        title: resItem.title,
        description: resItem.description,
        subjectCode: resItem.subjectCode,
        subjectName: resItem.subjectName,
        branch: resItem.branch,
        semester: resItem.semester,
        resourceType: resItem.resourceType,
        moduleOrChapter: resItem.moduleOrChapter,
        fileUrl: "https://campusloop.space/docs/academic-sample.pdf",
        driveUrl: "https://drive.google.com/drive/folders/campusloop-demo",
        attachments: [
          {
            id: `seed_att_${resItem.id}`,
            title: `${resItem.subjectCode} - Complete Verified Guide.pdf`,
            url: "https://campusloop.space/docs/academic-sample.pdf",
            type: "PDF",
            sizeBytes: 4200000,
            pageCount: 38,
            description: "High-yield verified handwritten study material",
          },
        ],
        tags: resItem.tags,
        upvotesCount: resItem.upvotesCount,
        downloadsCount: resItem.downloadsCount,
        viewsCount: resItem.viewsCount,
        isVerified: resItem.isVerified,
        createdAt: resDate,
        updatedAt: resDate,
      })
      .onConflictDoUpdate({
        target: academicResources.id,
        set: {
          title: resItem.title,
          description: resItem.description,
          upvotesCount: resItem.upvotesCount,
          downloadsCount: resItem.downloadsCount,
          viewsCount: resItem.viewsCount,
        },
      });

    insertedResources++;

    if (resItem.comments && resItem.comments.length > 0) {
      for (const acm of resItem.comments) {
        const commenter = SEED_PERSONAS[acm.authorIndex % SEED_PERSONAS.length];
        await db
          .insert(academicResourceComments)
          .values({
            id: acm.id,
            resourceId: resItem.id,
            authorId: commenter.id,
            body: acm.body,
            isHelpful: acm.isHelpful,
            createdAt: new Date(resDate.getTime() + 2 * 60 * 60 * 1000),
            updatedAt: new Date(resDate.getTime() + 2 * 60 * 60 * 1000),
          })
          .onConflictDoNothing();
        insertedResourceComments++;
      }
    }
  }
  console.log(`✅ ${insertedResources} academic resources seeded with ${insertedResourceComments} review comments.\n`);

  // -------------------------------------------------------------
  // Step 6: Seed Campus Events & Registrations
  // -------------------------------------------------------------
  console.log(`🎪 Step 6: Scheduling ${SEED_EVENTS.length} campus events & registrations...`);
  let insertedEvents = 0;
  let totalRegistrations = 0;

  for (const ev of SEED_EVENTS) {
    const organizer = SEED_PERSONAS[ev.organizerIndex % SEED_PERSONAS.length];
    const instId = resolveInstId(ev.institutionKey);

    const now = new Date();
    const startDate = new Date(now.getTime() + ev.daysFromNow * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + ev.durationHours * 60 * 60 * 1000);
    const regDeadline = new Date(startDate.getTime() - 12 * 60 * 60 * 1000);

    await db
      .insert(events)
      .values({
        id: ev.id,
        slug: ev.slug,
        title: ev.title,
        tagline: ev.tagline,
        description: ev.description,
        bannerUrl: ev.bannerUrl,
        clubName: ev.clubName,
        organizerProfileId: organizer.id,
        institutionId: instId,
        eligibleInstitutionIds: ["ALL"],
        eventType: ev.eventType,
        mode: ev.mode,
        venue: ev.venue,
        startDate,
        endDate,
        registrationDeadline: regDeadline,
        participationType: ev.participationType,
        minTeamSize: ev.minTeamSize || 1,
        maxTeamSize: ev.maxTeamSize || 4,
        isPaid: false,
        entryFee: "Free",
        prizesDescription: ev.prizesDescription,
        perks: ev.perks,
        loopPointsReward: ev.loopPointsReward,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: events.id,
        set: {
          title: ev.title,
          description: ev.description,
          startDate,
          endDate,
        },
      });

    insertedEvents++;

    // Insert student registrations
    for (const regIndex of ev.registrantIndices) {
      const registrant = SEED_PERSONAS[regIndex % SEED_PERSONAS.length];
      const regId = `seed_202609_ereg_${ev.slug}_${registrant.id}`;

      await db
        .insert(eventRegistrations)
        .values({
          id: regId,
          eventId: ev.id,
          profileId: registrant.id,
          registrationType: ev.participationType === "TEAM" ? "TEAM" : "SOLO",
          status: "CONFIRMED",
          createdAt: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing();

      totalRegistrations++;
    }
  }
  console.log(`✅ ${insertedEvents} campus events created with ${totalRegistrations} verified student registrations.\n`);

  // -------------------------------------------------------------
  // Step 7: Seed Campus Stories (Active vibes)
  // -------------------------------------------------------------
  console.log(`📸 Step 7: Broadcasting ${SEED_STORIES.length} active campus vibe stories...`);
  let insertedStories = 0;

  for (const st of SEED_STORIES) {
    const user = SEED_PERSONAS[st.userIndex % SEED_PERSONAS.length];
    const now = new Date();
    const createdAt = new Date(now.getTime() - st.hoursAgo * 60 * 60 * 1000);
    // Expires 36 hours from creation so visiting students see active campus vibes
    const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);

    await db
      .insert(stories)
      .values({
        id: st.id,
        userId: user.id,
        text: st.text,
        mediaUrl: st.mediaUrl || null,
        backgroundColor: st.backgroundColor,
        createdAt,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: stories.id,
        set: {
          text: st.text,
          expiresAt,
        },
      });

    insertedStories++;
  }
  console.log(`✅ ${insertedStories} active stories broadcasted to campus timeline.\n`);

  // -------------------------------------------------------------
  // Grand Summary
  // -------------------------------------------------------------
  const grandTotal =
    insertedUsers +
    insertedCommunities +
    insertedMemberships +
    insertedPosts +
    totalVotesCount +
    totalPollOptions +
    totalPollVotes +
    topCommentsCount +
    nestedRepliesCount +
    insertedResources +
    insertedResourceComments +
    insertedEvents +
    totalRegistrations +
    insertedStories;

  console.log("================================================================");
  console.log("🎉 CAMPUSLOOP SEEDING PIPELINE COMPLETED SUCCESSFULLY!");
  console.log("================================================================");
  console.log(`🔹 Student Personas:        ${insertedUsers}`);
  console.log(`🔹 Communities:             ${insertedCommunities}`);
  console.log(`🔹 Community Memberships:   ${insertedMemberships}`);
  console.log(`🔹 Timeline Posts:          ${insertedPosts}`);
  console.log(`🔹 Post Upvotes:            ${totalVotesCount}`);
  console.log(`🔹 Poll Options:            ${totalPollOptions}`);
  console.log(`🔹 Student Poll Votes:      ${totalPollVotes}`);
  console.log(`🔹 Comments & Replies:      ${topCommentsCount + nestedRepliesCount}`);
  console.log(`🔹 Academic Resources:      ${insertedResources}`);
  console.log(`🔹 Academic Comments:       ${insertedResourceComments}`);
  console.log(`🔹 Campus Events:           ${insertedEvents}`);
  console.log(`🔹 Event Registrations:     ${totalRegistrations}`);
  console.log(`🔹 Campus Stories (Vibes):  ${insertedStories}`);
  console.log("----------------------------------------------------------------");
  console.log(`🔥 TOTAL SEED ITEMS INGESTED: ${grandTotal} items`);
  console.log("================================================================\n");
}

if (import.meta.main) {
  runPipeline()
    .then(() => {
      console.log("✨ All operations complete. Exiting gracefully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Pipeline failed with error:", err);
      process.exit(1);
    });
}
