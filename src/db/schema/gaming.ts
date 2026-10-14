import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./common";
import { institutions } from "./institutions";
import { userProfiles } from "./users";

/**
 * Campus Gaming Lobbies
 * Squad / Scrim / Casual / Ranked matchmaking lobbies
 */
export const gamingLobbies = pgTable(
  "gaming_lobbies",
  {
    id: id(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    hostId: text("host_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    gameName: text("game_name").notNull(), // 'Valorant' | 'Chess' | 'BGMI' | 'FIFA' | 'CS2' | 'Rocket League' | 'Other'
    title: text("title").notNull(),
    description: text("description"),
    mode: text("mode").default("5v5").notNull(), // '1v1' | '5v5' | 'SCRIM' | 'RANKED' | 'TOURNAMENT' | 'CASUAL'
    rankTier: text("rank_tier"), // e.g. 'Gold / Platinum' or '1600+ ELO'
    gamerTag: text("gamer_tag"), // Host's in-game ID / Riot ID / Chess username
    slotsTotal: integer("slots_total").default(5).notNull(),
    slotsFilled: integer("slots_filled").default(1).notNull(),
    discordOrVoiceUrl: text("discord_or_voice_url"),
    scheduledAt: text("scheduled_at"), // e.g. 'Tonight 10:30 PM'
    status: text("status").default("OPEN").notNull(), // 'OPEN' | 'FULL' | 'IN_GAME' | 'COMPLETED' | 'CANCELLED'
    players: text("players"), // JSON stringified array of player objects [{ userId, username, displayName, avatarUrl, gamerTag, role }]
    createdAt,
    updatedAt,
  },
  (table) => [
    index("gaming_institution_created_idx").on(table.institutionId, table.createdAt),
    index("gaming_host_created_idx").on(table.hostId, table.createdAt),
    index("gaming_game_name_idx").on(table.gameName),
    index("gaming_status_idx").on(table.status),
  ]
);

export type GamingLobby = typeof gamingLobbies.$inferSelect;
export type NewGamingLobby = typeof gamingLobbies.$inferInsert;

/**
 * Normalized Lobby Members table for database-enforced unique membership
 * and safe concurrent slot acquisition.
 */
export const gamingLobbyMembers = pgTable(
  "gaming_lobby_members",
  {
    id: id(),
    lobbyId: text("lobby_id")
      .notNull()
      .references(() => gamingLobbies.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    role: text("role"), // e.g. 'Duelist', 'Sniper', 'Host', 'Mid'
    gamerTag: text("gamer_tag"), // In-game handle
    createdAt,
  },
  (table) => [
    uniqueIndex("gaming_lobby_members_unique_idx").on(table.lobbyId, table.userId),
    index("gaming_lobby_members_lobby_idx").on(table.lobbyId),
    index("gaming_lobby_members_user_idx").on(table.userId),
  ]
);

export type GamingLobbyMember = typeof gamingLobbyMembers.$inferSelect;
export type NewGamingLobbyMember = typeof gamingLobbyMembers.$inferInsert;

/**
 * Gamer Profiles & Teammate Preferences (LFT)
 * Allows students to specify their in-game tags, ranks, roles, and looking-for-team preferences
 */
export const gamerProfiles = pgTable(
  "gamer_profiles",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    primaryGame: text("primary_game").default("Valorant").notNull(),
    games: jsonb("games")
      .$type<
        Array<{
          gameName: string;
          gamerTag: string;
          rankTier?: string;
          role?: string;
          isHandlePublic?: boolean;
        }>
      >()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    platforms: jsonb("platforms")
      .$type<string[]>()
      .default(sql`'["PC"]'::jsonb`)
      .notNull(), // 'PC' | 'MOBILE' | 'PLAYSTATION' | 'XBOX' | 'SWITCH'
    playStyle: text("play_style").default("BOTH").notNull(), // 'CASUAL' | 'COMPETITIVE' | 'BOTH'
    preferredAvailability: text("preferred_availability").default("EVENING").notNull(), // 'EVENING' | 'LATE_NIGHT' | 'WEEKENDS' | 'FLEXIBLE'
    voicePreference: text("voice_preference").default("DISCORD").notNull(), // 'DISCORD' | 'IN_GAME' | 'LISTEN_ONLY' | 'NO_VOICE'
    isLookingForTeam: boolean("is_looking_for_team").default(true).notNull(),
    isHandlePublic: boolean("is_handle_public").default(true).notNull(),
    bio: text("bio"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("gamer_profiles_user_idx").on(table.userId),
    index("gamer_profiles_institution_idx").on(table.institutionId),
    index("gamer_profiles_primary_game_idx").on(table.primaryGame),
    index("gamer_profiles_lft_idx").on(table.isLookingForTeam),
  ]
);

export type GamerProfile = typeof gamerProfiles.$inferSelect;
export type NewGamerProfile = typeof gamerProfiles.$inferInsert;

/**
 * Campus Tournaments & Esports Championships
 */
export const gamingTournaments = pgTable(
  "gaming_tournaments",
  {
    id: id(),
    institutionId: text("institution_id").references(() => institutions.id, {
      onDelete: "cascade",
    }),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    gameName: text("game_name").notNull(),
    format: text("format").default("SINGLE_ELIMINATION").notNull(), // 'SINGLE_ELIMINATION' | 'ROUND_ROBIN'
    teamFormat: text("team_format").default("SOLO").notNull(), // 'SOLO' | 'DUO' | 'SQUAD_4' | 'SQUAD_5'
    maxParticipants: integer("max_participants").default(8).notNull(), // 4, 8, 16, 32
    currentParticipants: integer("current_participants").default(0).notNull(),
    registrationDeadline: timestamp("registration_deadline", { withTimezone: true }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    rules: text("rules"),
    prizePool: text("prize_pool"),
    status: text("status").default("REGISTRATION_OPEN").notNull(), // 'DRAFT' | 'REGISTRATION_OPEN' | 'CHECK_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    bannerUrl: text("banner_url"),
    bracketData: jsonb("bracket_data").$type<any>(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("gaming_tournaments_slug_idx").on(table.slug),
    index("gaming_tournaments_institution_idx").on(table.institutionId),
    index("gaming_tournaments_status_idx").on(table.status),
    index("gaming_tournaments_game_idx").on(table.gameName),
    index("gaming_tournaments_starts_at_idx").on(table.startsAt),
  ]
);

export type GamingTournament = typeof gamingTournaments.$inferSelect;
export type NewGamingTournament = typeof gamingTournaments.$inferInsert;

/**
 * Tournament Entries (Solo players or Teams)
 */
export const gamingTournamentEntries = pgTable(
  "gaming_tournament_entries",
  {
    id: id(),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => gamingTournaments.id, { onDelete: "cascade" }),
    captainId: text("captain_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    teamName: text("team_name").notNull(),
    roster: jsonb("roster")
      .$type<
        Array<{
          userId: string;
          username: string;
          displayName: string;
          gamerTag?: string;
          role?: string;
        }>
      >()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    seed: integer("seed"),
    isCheckedIn: boolean("is_checked_in").default(false).notNull(),
    status: text("status").default("REGISTERED").notNull(), // 'REGISTERED' | 'CHECKED_IN' | 'ELIMINATED' | 'DISQUALIFIED'
    finalRank: integer("final_rank"), // 1 = Champion, 2 = Runner-up, etc.
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("gaming_tournament_entries_unique_idx").on(table.tournamentId, table.captainId),
    index("gaming_tournament_entries_tournament_idx").on(table.tournamentId),
    index("gaming_tournament_entries_captain_idx").on(table.captainId),
  ]
);

export type GamingTournamentEntry = typeof gamingTournamentEntries.$inferSelect;
export type NewGamingTournamentEntry = typeof gamingTournamentEntries.$inferInsert;

/**
 * Tournament Matches & Bracket Progression
 */
export const gamingTournamentMatches = pgTable(
  "gaming_tournament_matches",
  {
    id: id(),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => gamingTournaments.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(), // 1 = QF, 2 = SF, 3 = Finals, etc.
    matchNumber: integer("match_number").notNull(), // 1, 2, 3 within the tournament
    nextMatchId: text("next_match_id"), // ID of next match winner advances to
    entry1Id: text("entry1_id").references(() => gamingTournamentEntries.id, {
      onDelete: "set null",
    }),
    entry2Id: text("entry2_id").references(() => gamingTournamentEntries.id, {
      onDelete: "set null",
    }),
    winnerId: text("winner_id").references(() => gamingTournamentEntries.id, {
      onDelete: "set null",
    }),
    score1: integer("score1").default(0).notNull(),
    score2: integer("score2").default(0).notNull(),
    reportedByEntryId: text("reported_by_entry_id"),
    reportedByUserId: text("reported_by_user_id"),
    status: text("status").default("PENDING").notNull(), // 'PENDING' | 'READY' | 'IN_PROGRESS' | 'REPORTED' | 'CONFIRMED' | 'DISPUTED' | 'CANCELLED'
    disputeReason: text("dispute_reason"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("gaming_matches_tournament_round_idx").on(
      table.tournamentId,
      table.roundNumber,
      table.matchNumber
    ),
    index("gaming_matches_tournament_status_idx").on(table.tournamentId, table.status),
  ]
);

export type GamingTournamentMatch = typeof gamingTournamentMatches.$inferSelect;
export type NewGamingTournamentMatch = typeof gamingTournamentMatches.$inferInsert;

/**
 * Seasonal Progression & Fair Play Reputation
 * Backed by real tournament & match participation
 */
export const gamingProgression = pgTable(
  "gaming_progression",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    gameName: text("game_name").notNull(),
    matchesPlayed: integer("matches_played").default(0).notNull(),
    matchesWon: integer("matches_won").default(0).notNull(),
    tournamentsWon: integer("tournaments_won").default(0).notNull(),
    tournamentsPlayed: integer("tournaments_played").default(0).notNull(),
    fairPlayHonors: integer("fair_play_honors").default(0).notNull(),
    rankingPoints: integer("ranking_points").default(1000).notNull(),
    season: text("season").default("2026-S1").notNull(),
    isOptedOut: boolean("is_opted_out").default(false).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("gaming_progression_user_game_season_idx").on(
      table.userId,
      table.gameName,
      table.season
    ),
    index("gaming_progression_institution_game_idx").on(
      table.institutionId,
      table.gameName,
      table.rankingPoints
    ),
    index("gaming_progression_ranking_points_idx").on(table.gameName, table.rankingPoints),
  ]
);

export type GamingProgression = typeof gamingProgression.$inferSelect;
export type NewGamingProgression = typeof gamingProgression.$inferInsert;
