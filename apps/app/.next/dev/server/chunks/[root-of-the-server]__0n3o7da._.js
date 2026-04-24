module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accounts",
    ()=>accounts,
    "accountsRelations",
    ()=>accountsRelations,
    "sessions",
    ()=>sessions,
    "sessionsRelations",
    ()=>sessionsRelations,
    "users",
    ()=>users,
    "usersRelations",
    ()=>usersRelations,
    "verifications",
    ()=>verifications
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/relations.js [app-route] (ecmascript)");
;
;
const users = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqliteTable"])("users", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("email").notNull().unique(),
    plan: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("plan", {
        enum: [
            "free",
            "plus",
            "pro"
        ]
    }).notNull().default("free"),
    isPaid: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("is_paid", {
        mode: "boolean"
    }).notNull().default(false),
    resumeCreatedCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("resume_created_count").notNull().default(0),
    coverLetterCreatedCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("cover_letter_created_count").notNull().default(0),
    emailVerified: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("email_verified", {
        mode: "boolean"
    }).notNull().default(false),
    image: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("image"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date()),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date())
});
const sessions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqliteTable"])("sessions", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("expires_at", {
        mode: "timestamp"
    }).notNull(),
    token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("token").notNull().unique(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date()),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date()),
    ipAddress: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("ip_address"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    })
});
const accounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqliteTable"])("accounts", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    accountId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("account_id").notNull(),
    providerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("provider_id").notNull(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    accessToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("access_token"),
    refreshToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("refresh_token"),
    idToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id_token"),
    accessTokenExpiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("access_token_expires_at", {
        mode: "timestamp"
    }),
    refreshTokenExpiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("refresh_token_expires_at", {
        mode: "timestamp"
    }),
    scope: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("scope"),
    password: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("password"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date()),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date())
});
const verifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqliteTable"])("verifications", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    identifier: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("identifier").notNull(),
    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("value").notNull(),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("expires_at", {
        mode: "timestamp"
    }).notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp"
    }).$defaultFn(()=>new Date()),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp"
    }).$defaultFn(()=>new Date())
});
const usersRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["relations"])(users, ({ many })=>({
        sessions: many(sessions),
        accounts: many(accounts)
    }));
const sessionsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["relations"])(sessions, ({ one })=>({
        user: one(users, {
            fields: [
                sessions.userId
            ],
            references: [
                users.id
            ]
        })
    }));
const accountsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["relations"])(accounts, ({ one })=>({
        user: one(users, {
            fields: [
                accounts.userId
            ],
            references: [
                users.id
            ]
        })
    }));
}),
"[project]/apps/app/db/schema/resumes.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resumes",
    ()=>resumes,
    "resumesRelations",
    ()=>resumesRelations,
    "usersResumeRelations",
    ()=>usersResumeRelations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/relations.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
;
;
;
const resumes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqliteTable"])("resumes", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, {
        onDelete: "cascade"
    }),
    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("title").notNull(),
    templateId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("template_id").notNull(),
    // Store the full resume data as JSON
    data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("data", {
        mode: "json"
    }).$type(),
    // Metadata
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("status", {
        enum: [
            "draft",
            "completed"
        ]
    }).notNull().default("draft"),
    lastEditedSection: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("last_edited_section"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date()),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date())
});
const resumesRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["relations"])(resumes, ({ one })=>({
        user: one(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"], {
            fields: [
                resumes.userId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id
            ]
        })
    }));
const usersResumeRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["relations"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"], ({ many })=>({
        resumes: many(resumes)
    }));
}),
"[project]/apps/app/db/schema/cover-letters.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "coverLetters",
    ()=>coverLetters,
    "coverLettersRelations",
    ()=>coverLettersRelations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/relations.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
;
;
;
const coverLetters = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqliteTable"])("cover_letters", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, {
        onDelete: "cascade"
    }),
    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("title").notNull(),
    data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("data", {
        mode: "json"
    }).$type().notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date()),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date())
});
const coverLettersRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["relations"])(coverLetters, ({ one })=>({
        user: one(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"], {
            fields: [
                coverLetters.userId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id
            ]
        })
    }));
}),
"[project]/apps/app/db/schema/processed-transactions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "processedTransactions",
    ()=>processedTransactions,
    "processedTransactionsRelations",
    ()=>processedTransactionsRelations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/integer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/table.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sqlite-core/columns/text.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/relations.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
;
;
;
const processedTransactions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sqliteTable"])("processed_transactions", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("user_id").notNull().references(()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, {
        onDelete: "cascade"
    }),
    provider: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("provider").notNull().default("paddle"),
    transactionId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("transaction_id").notNull().unique(),
    plan: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("plan", {
        enum: [
            "plus",
            "pro"
        ]
    }).notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("status").notNull().default("completed"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("created_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date()),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sqlite$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("updated_at", {
        mode: "timestamp"
    }).notNull().$defaultFn(()=>new Date())
});
const processedTransactionsRelations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$relations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["relations"])(processedTransactions, ({ one })=>({
        user: one(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"], {
            fields: [
                processedTransactions.userId
            ],
            references: [
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id
            ]
        })
    }));
}),
"[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
/**
 * Database Schema Barrel Export
 * All schema definitions are exported from here
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/resumes.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/cover-letters.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/processed-transactions.ts [app-route] (ecmascript)");
;
;
;
;
}),
"[project]/apps/app/db/schema/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accounts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["accounts"],
    "accountsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["accountsRelations"],
    "coverLetters",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"],
    "coverLettersRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLettersRelations"],
    "processedTransactions",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processedTransactions"],
    "processedTransactionsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processedTransactionsRelations"],
    "resumes",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"],
    "resumesRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumesRelations"],
    "sessions",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessions"],
    "sessionsRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessionsRelations"],
    "users",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"],
    "usersRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["usersRelations"],
    "usersResumeRelations",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["usersResumeRelations"],
    "verifications",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifications"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/resumes.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/cover-letters.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/processed-transactions.ts [app-route] (ecmascript)");
}),
"[project]/apps/app/db/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$libsql$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/libsql/driver.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f40$libsql$2f$client$29$__ = __turbopack_context__.i("[externals]/@libsql/client [external] (@libsql/client, esm_import, [project]/node_modules/@libsql/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$libsql$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f40$libsql$2f$client$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$libsql$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f40$libsql$2f$client$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
/**
 * Turso Database Client
 * Creates a connection to the Turso database using LibSQL
 */ const client = (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f40$libsql$2f$client$29$__["createClient"])({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$libsql$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["drizzle"])(client, {
    schema: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:fs/promises [external] (node:fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs/promises", () => require("node:fs/promises"));

module.exports = mod;
}),
"[externals]/node:os [external] (node:os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:os", () => require("node:os"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/apps/app/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "auth",
    ()=>auth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$better$2d$auth$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/better-auth/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$better$2d$auth$2f$dist$2f$auth$2f$full$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/better-auth/dist/auth/full.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$better$2d$auth$2f$dist$2f$adapters$2f$drizzle$2d$adapter$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/better-auth/dist/adapters/drizzle-adapter/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$better$2d$auth$2f$drizzle$2d$adapter$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@better-auth/drizzle-adapter/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$better$2d$auth$2f$dist$2f$integrations$2f$next$2d$js$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/better-auth/dist/integrations/next-js.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$better$2d$auth$2f$dist$2f$auth$2f$full$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["betterAuth"])({
    secret: process.env.BETTER_AUTH_SECRET,
    database: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$better$2d$auth$2f$drizzle$2d$adapter$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["drizzleAdapter"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"], {
        provider: "sqlite",
        schema: {
            user: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"],
            session: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessions"],
            account: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["accounts"],
            verification: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifications"]
        }
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }
    },
    plugins: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$better$2d$auth$2f$dist$2f$integrations$2f$next$2d$js$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["nextCookies"])()
    ]
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/app/trpc/init.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "createCallerFactory",
    ()=>createCallerFactory,
    "createTRPCContext",
    ()=>createTRPCContext,
    "createTRPCRouter",
    ()=>createTRPCRouter,
    "protectedProcedure",
    ()=>protectedProcedure,
    "publicProcedure",
    ()=>publicProcedure
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$initTRPC$2d$T5bbc89W$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/initTRPC-T5bbc89W.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-D4V22yc5.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$superjson$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/superjson/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$errors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/errors.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
const createTRPCContext = async ()=>{
    const session = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["auth"].api.getSession({
        headers: await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["headers"])()
    });
    return {
        db: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"],
        session,
        user: session?.user ?? null
    };
};
/**
 * tRPC Initialization
 * Configured with superjson for data serialization
 */ const t = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$initTRPC$2d$T5bbc89W$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["initTRPC"].context().create({
    transformer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$superjson$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"],
    errorFormatter ({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$errors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ZodError"] ? error.cause.flatten() : null
            }
        };
    }
});
const createTRPCRouter = t.router;
const createCallerFactory = t.createCallerFactory;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next })=>{
    if (!ctx.session || !ctx.user) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "UNAUTHORIZED",
            message: "You must be logged in to perform this action"
        });
    }
    return next({
        ctx: {
            ...ctx,
            session: ctx.session,
            user: ctx.user
        }
    });
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/app/lib/ai.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AI_MODEL",
    ()=>AI_MODEL,
    "AI_MODEL_FALLBACK",
    ()=>AI_MODEL_FALLBACK,
    "buildAchievementBuilderPrompt",
    ()=>buildAchievementBuilderPrompt,
    "buildCoverLetterFromEditorPrompt",
    ()=>buildCoverLetterFromEditorPrompt,
    "buildCoverLetterFromResumePrompt",
    ()=>buildCoverLetterFromResumePrompt,
    "buildCoverLetterPrompt",
    ()=>buildCoverLetterPrompt,
    "buildImproveFullResumePrompt",
    ()=>buildImproveFullResumePrompt,
    "buildImproveSectionPrompt",
    ()=>buildImproveSectionPrompt,
    "buildKeywordBoosterPrompt",
    ()=>buildKeywordBoosterPrompt,
    "buildSpellCheckPrompt",
    ()=>buildSpellCheckPrompt,
    "buildSuggestionPrompt",
    ()=>buildSuggestionPrompt,
    "callWithFallback",
    ()=>callWithFallback,
    "extractContent",
    ()=>extractContent,
    "extractJsonArray",
    ()=>extractJsonArray,
    "extractJsonObject",
    ()=>extractJsonObject,
    "extractResumeTextFields",
    ()=>extractResumeTextFields,
    "formatFieldsForPrompt",
    ()=>formatFieldsForPrompt,
    "openrouter",
    ()=>openrouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/openai/client.mjs [app-route] (ecmascript) <export OpenAI as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-D4V22yc5.mjs [app-route] (ecmascript)");
;
;
const openrouter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$openai$2f$client$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__OpenAI__as__default$3e$__["default"]({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
        "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost:3000",
        "X-Title": "Craftiv"
    }
});
const AI_MODEL = "google/gemini-2.0-flash-001";
const AI_MODEL_FALLBACK = "qwen/qwen3.6-plus-preview:free";
function extractContent(choice) {
    return choice?.message?.content ?? choice?.message?.reasoning_content ?? choice?.message?.reasoning ?? choice?.text ?? (typeof choice?.message === "string" ? choice.message : null);
}
async function callWithFallback(params) {
    const models = [
        AI_MODEL,
        AI_MODEL_FALLBACK
    ];
    for (const model of models){
        try {
            console.log(`[AI] Trying model: ${model}`);
            const start = Date.now();
            const response = await openrouter.chat.completions.create({
                model,
                messages: params.messages,
                max_tokens: params.maxTokens,
                temperature: params.temperature
            });
            const elapsed = Date.now() - start;
            const finish = response.choices[0]?.finish_reason ?? "N/A";
            const tokens = response.usage?.total_tokens ?? "N/A";
            const content = extractContent(response.choices[0])?.trim();
            console.log(`[AI] ${model} — ${elapsed}ms, tokens: ${tokens}, finish: ${finish}`);
            if (content) {
                console.log(`[AI] Got content (${content.length} chars) from ${model}`);
                return {
                    content,
                    model
                };
            }
            console.warn(`[AI] Empty content from ${model}. Choice:`, JSON.stringify(response.choices[0], null, 2).slice(0, 500));
        } catch (error) {
            console.error(`[AI] Error from ${model}:`, error.message ?? error);
        }
    }
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
        code: "INTERNAL_SERVER_ERROR",
        message: "All AI models failed to respond. Please try again later."
    });
}
function extractJsonObject(raw) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
        return JSON.parse(match[0]);
    } catch  {
        return null;
    }
}
function extractJsonArray(raw) {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : null;
    } catch  {
        return null;
    }
}
function buildImproveSectionPrompt(section, content, targetRole) {
    const roleHint = targetRole ? `The target job role is: ${targetRole}.` : "";
    return `You are a professional resume writer. ${roleHint}
Improve the following resume ${section} section to be more impactful, concise, and ATS-friendly.
Use strong action verbs and quantify achievements where possible.
Return ONLY the improved text. No explanation, no markdown formatting, no quotes.

Original:
${content}`;
}
function buildImproveFullResumePrompt(data, targetRole) {
    const roleHint = targetRole ? `The target job role is: ${targetRole}.` : "";
    return `You are a professional resume writer. ${roleHint}
Review the following resume data and return an improved version.
Improve the summary to be compelling and ATS-friendly.
Improve each experience description with strong action verbs and quantified achievements.
Improve each education description if present.
Keep all other fields (names, dates, IDs, etc.) exactly the same.
Return ONLY valid JSON matching the exact same structure. No markdown, no explanation.

Resume data:
${JSON.stringify(data, null, 2)}`;
}
function buildSpellCheckPrompt(fieldsText) {
    return `You are a professional resume proofreader and content reviewer. Analyze the following resume text fields and find ALL issues.

Important exclusions:
- Do NOT report spelling or grammar issues for personal identifiers such as full name, first name, last name, email address, or phone number.
- Do NOT report spelling or grammar issues for employer or company names (including company name fields).

Check for these types of problems:
1. SPELLING: Misspelled words, typos, made-up words (e.g. "Rfacturing", "hillo", "heiy")
2. GRAMMAR: Grammatical errors, wrong tense, subject-verb disagreement
3. PLACEHOLDER: Lorem ipsum text, placeholder text, template text that was not replaced (e.g. "[job title]", "[X] years"), or any nonsensical filler content that does not belong in a real resume
4. CONTENT: Inappropriate or irrelevant content for a professional resume

For each issue, return a JSON object with:
- "type": one of "spelling", "grammar", "placeholder", or "content"
- "field": the field name exactly as given in brackets
- "original": the exact problematic word, phrase, or sentence
- "corrected": the suggested correction (for placeholder/content issues, write a brief professional replacement or "Remove this placeholder text and write actual content")
- "context": a short phrase showing where the issue appears

Return a JSON array of all issues found. If no issues, return [].
Return ONLY the JSON array. No markdown, no explanation, no code fences, no extra text.

Resume fields:
${fieldsText}`;
}
function buildSuggestionPrompt(field, currentContent, jobTitle) {
    const jobContext = jobTitle ? `The person's job title is "${jobTitle}".` : "";
    let sectionHint;
    if (field.includes("Description") && field.includes("Experience")) {
        sectionHint = "This is a work experience description. Write 2-4 bullet points describing achievements and responsibilities using strong action verbs with quantified results.";
    } else if (field.includes("Description") && field.includes("Education")) {
        sectionHint = "This is an education description. Briefly mention relevant coursework, honors, or academic achievements.";
    } else if (field === "Summary") {
        sectionHint = "This is a professional summary. Write a compelling 2-3 sentence overview highlighting experience, key skills, and career goals.";
    } else {
        sectionHint = `This is the "${field}" field of a resume.`;
    }
    return `You are a professional resume writer. ${jobContext}
${sectionHint}

The current content is inappropriate or needs replacement:
"${currentContent}"

Write a professional replacement for this resume field.
Return ONLY the replacement text. No explanation, no markdown, no quotes, no bullet symbols.
Keep it concise and professional.`;
}
function buildKeywordBoosterPrompt(resumeText, jobDescription) {
    return `You are an expert ATS keyword analyst. Compare the resume below against the job description and identify missing keywords the candidate should add.

For each missing keyword, return a JSON object with:
- "keyword": the exact keyword or phrase missing
- "importance": "high", "medium", or "low"
- "section": which resume section to place it in ("summary", "experience", "skills", or "education")
- "suggestion": a brief sentence showing how to naturally incorporate this keyword

Return a JSON array of objects. If no keywords are missing, return [].
Return ONLY the JSON array. No markdown, no explanation, no code fences.

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;
}
function buildAchievementBuilderPrompt(jobTitle, employer, description, targetRole) {
    const roleHint = targetRole ? `The candidate is targeting a role as: ${targetRole}.` : "";
    return `You are a professional resume writer specializing in accomplishment-based bullet points. ${roleHint}

The candidate worked as "${jobTitle}" at "${employer}". Their current description is:
"${description}"

Transform this into 3-5 powerful accomplishment bullet points. Each bullet should:
- Start with a strong action verb (e.g. Spearheaded, Delivered, Optimized, Architected)
- Include a quantified metric or a placeholder like [X%], [X+], [$Xk] where the candidate can fill in real numbers
- Show business impact, not just responsibility

Return ONLY the bullet points, one per line, each starting with "- ". No explanation, no markdown headers, no numbering.`;
}
function buildCoverLetterPrompt(resumeText, jobDescription, companyName, tone) {
    const toneGuide = {
        professional: "Maintain a polished, formal tone throughout.",
        confident: "Use a confident, direct tone that emphasizes proven expertise and leadership.",
        enthusiastic: "Write with genuine enthusiasm and passion for the role and company."
    };
    return `You are a professional cover letter writer. Write a compelling cover letter based on the resume and job description below.

Guidelines:
- ${toneGuide[tone]}
- Address it to "Hiring Manager" at "${companyName || "the company"}"
- Open with a strong hook that connects the candidate to the role
- Highlight 2-3 relevant achievements from the resume that match the job requirements
- Close with a confident call to action
- Keep it to 3-4 paragraphs, under 350 words
- Do NOT include the date, address block, or "Sincerely" signature — just the letter body

Return ONLY the cover letter text. No markdown, no explanation, no quotes.

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}`;
}
function extractResumeTextFields(data) {
    const fields = [];
    if (data.summary) fields.push({
        field: "Summary",
        value: data.summary
    });
    if (data.contact) {
        const c = data.contact;
        if (c.firstName) fields.push({
            field: "First Name",
            value: c.firstName
        });
        if (c.lastName) fields.push({
            field: "Last Name",
            value: c.lastName
        });
        if (c.desiredJobTitle) fields.push({
            field: "Job Title",
            value: c.desiredJobTitle
        });
    }
    if (Array.isArray(data.experiences)) {
        data.experiences.forEach((exp, i)=>{
            const n = i + 1;
            if (exp.jobTitle) fields.push({
                field: `Experience ${n} - Job Title`,
                value: exp.jobTitle
            });
            if (exp.employer) fields.push({
                field: `Experience ${n} - Employer`,
                value: exp.employer
            });
            if (exp.description) fields.push({
                field: `Experience ${n} - Description`,
                value: exp.description
            });
        });
    }
    if (Array.isArray(data.educations)) {
        data.educations.forEach((edu, i)=>{
            const n = i + 1;
            if (edu.schoolName) fields.push({
                field: `Education ${n} - School`,
                value: edu.schoolName
            });
            if (edu.degree) fields.push({
                field: `Education ${n} - Degree`,
                value: edu.degree
            });
            if (edu.description) fields.push({
                field: `Education ${n} - Description`,
                value: edu.description
            });
        });
    }
    if (Array.isArray(data.skills)) {
        data.skills.forEach((skill, i)=>{
            if (skill.name) fields.push({
                field: `Skill ${i + 1}`,
                value: skill.name
            });
        });
    }
    return fields;
}
function formatFieldsForPrompt(fields) {
    return fields.map((f)=>`[${f.field}]: ${f.value}`).join("\n");
}
function buildCoverLetterFromResumePrompt(resumeText) {
    return `You are a professional cover letter writer. Based ONLY on the resume below, write a compelling, versatile cover letter that the candidate can use for relevant job applications.

Guidelines:
- Maintain a polished, professional tone throughout
- Include a natural greeting and closing as part of the letter
- Mention 2-3 standout achievements or skills from the resume with specific details
- Keep it under 300 words total
- Do NOT mention a specific company or job title — keep it general enough to adapt

Return ONLY a JSON object with exactly this key. No markdown, no code fences, no explanation:
{
  "content": "the full cover letter text with paragraph breaks"
}

--- RESUME ---
${resumeText}`;
}
function buildCoverLetterFromEditorPrompt(input) {
    const company = input.companyName?.trim() || "the company";
    const hiring = input.hiringManagerName?.trim();
    return `You are a senior career writing assistant.

Write a high-quality, specific cover letter draft for the role "${input.targetJobTitle}" at "${company}".

Rules:
- Professional, human, and concise tone (no fluff, no cliches, no repetitive phrases).
- 170-260 words total.
- 3 to 4 short paragraphs.
- Include a greeting line. Use "${hiring ? `Dear ${hiring},` : "Dear Hiring Manager,"}".
- Mention the target job title naturally in the opening.
- Use concrete achievements from candidate context where available.
- End with a strong but natural closing line.
- Do NOT invent unrealistic claims or fake metrics.
- Return plain text only (no markdown, no bullets, no JSON).

Candidate context:
${input.candidateContext}

Existing draft (optional):
${input.existingDraft?.trim() || "(none)"}`;
}
}),
"[project]/apps/app/lib/chatbot-policy.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CHATBOT_NO_CODE_REPLY",
    ()=>CHATBOT_NO_CODE_REPLY,
    "CHATBOT_SYSTEM_PROMPT",
    ()=>CHATBOT_SYSTEM_PROMPT,
    "isProgrammingRelated",
    ()=>isProgrammingRelated,
    "looksLikeCodeOutput",
    ()=>looksLikeCodeOutput
]);
const CHATBOT_NO_CODE_REPLY = "I can help with general questions, but I can't provide programming or code-related guidance. Please ask about a non-programming topic.";
const CHATBOT_SYSTEM_PROMPT = `You are Crafty, a helpful and concise general-use assistant.
Rules:
- This chatbot is for general use only.
- Never provide programming help, coding explanations, debugging steps, scripts, APIs, algorithms, or code in any language.
- If the user asks for any programming-related help, politely refuse and restate that you can only help with general, non-programming topics.
- Do not output markdown code blocks or inline code snippets.
- Keep responses clear, practical, and friendly.`;
function isProgrammingRelated(text) {
    const lower = text.toLowerCase();
    const patterns = [
        "code",
        "coding",
        "programming",
        "developer",
        "debug",
        "bug",
        "algorithm",
        "script",
        "javascript",
        "typescript",
        "python",
        "java",
        "c++",
        "c#",
        "react",
        "next.js",
        "node.js",
        "sql",
        "html",
        "css",
        "api",
        "function",
        "class",
        "git",
        "terminal",
        "regex"
    ];
    return patterns.some((keyword)=>lower.includes(keyword));
}
function looksLikeCodeOutput(text) {
    return /```|`[^`]+`|function\s+\w+\s*\(|\bconst\s+\w+\s*=|\bimport\s+.+\s+from\b/i.test(text);
}
}),
"[project]/apps/app/trpc/routers/ai.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "aiRouter",
    ()=>aiRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-D4V22yc5.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/init.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/resumes.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/lib/ai.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$chatbot$2d$policy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/lib/chatbot-policy.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
// ── Shared helpers ──────────────────────────────────────────────────────────
async function getOwnedResume(db, resumeId, userId) {
    const resume = await db.query.resumes.findFirst({
        where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].id, resumeId)
    });
    if (!resume) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "NOT_FOUND",
            message: "Resume not found"
        });
    }
    if (resume.userId !== userId) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "FORBIDDEN",
            message: "Access denied"
        });
    }
    return resume;
}
function getResumeData(resume) {
    const data = resume.data;
    if (!data) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "BAD_REQUEST",
            message: "Resume has no content."
        });
    }
    return data;
}
function isIgnoredSpellCheckField(field) {
    const normalized = field.trim().toLowerCase();
    const ignoredLabels = [
        "first name",
        "last name",
        "full name",
        "email",
        "email address",
        "phone",
        "phone number",
        "mobile",
        "mobile number",
        "contact number",
        "employer",
        "company",
        "company name"
    ];
    return ignoredLabels.some((label)=>normalized.includes(label));
}
async function requirePremiumPlan(db, userId) {
    const user = await db.query.users.findFirst({
        where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, userId)
    });
    const plan = user?.plan ?? "free";
    if (plan === "free") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "FORBIDDEN",
            message: "This feature is available on Plus and Pro plans."
        });
    }
}
// ── Input schemas ───────────────────────────────────────────────────────────
const improveSectionInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resumeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    section: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "summary",
        "experience",
        "education"
    ]),
    content: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(3000),
    targetRole: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const improveFullResumeInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resumeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    targetRole: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const spellCheckInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resumeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const generateSuggestionInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resumeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    field: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    currentContent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    issueType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const keywordBoosterInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resumeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    jobDescription: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(5000)
});
const achievementBuilderInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resumeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    experienceIndex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0),
    targetRole: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const coverLetterInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resumeId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    jobDescription: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(5000),
    companyName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(200).default(""),
    tone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "professional",
        "confident",
        "enthusiastic"
    ]).default("professional")
});
const chatbotReplyInput = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(2000),
    history: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            "user",
            "assistant"
        ]),
        content: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(2000)
    })).max(12).optional()
});
const aiRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCRouter"])({
    improveSection: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(improveSectionInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildImproveSectionPrompt"])(input.section, input.content, input.targetRole);
        console.log(`[AI] improveSection — section: ${input.section}, length: ${input.content.length}`);
        const { content: improved, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            maxTokens: 2000,
            temperature: 0.7
        });
        console.log(`[AI] improveSection done — model: ${model}`);
        return {
            improved
        };
    }),
    improveFullResume: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(improveFullResumeInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const data = getResumeData(resume);
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildImproveFullResumePrompt"])(data, input.targetRole);
        console.log(`[AI] improveFullResume — resumeId: ${input.resumeId}`);
        const { content, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            maxTokens: 4000,
            temperature: 0.7
        });
        const improved = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractJsonObject"])(content);
        if (!improved) {
            console.error(`[AI] improveFullResume — invalid JSON from ${model}:`, content.slice(0, 300));
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "INTERNAL_SERVER_ERROR",
                message: "AI returned invalid format. Please try again."
            });
        }
        console.log(`[AI] improveFullResume done — model: ${model}`);
        return {
            improved
        };
    }),
    spellCheck: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(spellCheckInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const data = getResumeData(resume);
        const textFields = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractResumeTextFields"])(data).filter((field)=>!isIgnoredSpellCheckField(field.field));
        if (textFields.length === 0) {
            console.log("[AI] spellCheck — no text fields, skipping");
            return {
                issues: []
            };
        }
        const fieldsText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatFieldsForPrompt"])(textFields);
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSpellCheckPrompt"])(fieldsText);
        console.log(`[AI] spellCheck — resumeId: ${input.resumeId}, fields: ${textFields.length}`);
        const { content, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            maxTokens: 4000,
            temperature: 0.3
        });
        console.log(`[AI] spellCheck raw (${model}):`, content.slice(0, 500));
        const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractJsonArray"])(content);
        if (!parsed) {
            console.log("[AI] spellCheck — no valid JSON array in response");
            return {
                issues: []
            };
        }
        const issues = parsed.filter((item)=>item.field && item.original && item.corrected && item.context).map((item)=>({
                type: item.type || "spelling",
                field: item.field,
                original: item.original,
                corrected: item.corrected,
                context: item.context
            })).filter((issue)=>!isIgnoredSpellCheckField(issue.field));
        console.log(`[AI] spellCheck done — ${issues.length} issue(s) via ${model}`);
        return {
            issues
        };
    }),
    generateSuggestion: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(generateSuggestionInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const d = resume.data;
        const jobTitle = d?.contact?.desiredJobTitle || "";
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildSuggestionPrompt"])(input.field, input.currentContent, jobTitle);
        console.log(`[AI] generateSuggestion — field: ${input.field}, type: ${input.issueType}`);
        const { content: suggestion, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            maxTokens: 1000,
            temperature: 0.7
        });
        console.log(`[AI] generateSuggestion done — model: ${model}`);
        return {
            suggestion
        };
    }),
    keywordBooster: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(keywordBoosterInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const data = getResumeData(resume);
        const textFields = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractResumeTextFields"])(data);
        const resumeText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatFieldsForPrompt"])(textFields);
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildKeywordBoosterPrompt"])(resumeText, input.jobDescription);
        console.log(`[AI] keywordBooster — resumeId: ${input.resumeId}`);
        const { content, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            maxTokens: 3000,
            temperature: 0.4
        });
        const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractJsonArray"])(content);
        if (!parsed) {
            console.log("[AI] keywordBooster — no valid JSON array in response");
            return {
                keywords: []
            };
        }
        const keywords = parsed.filter((item)=>item.keyword && item.importance && item.section && item.suggestion).map((item)=>({
                keyword: item.keyword,
                importance: item.importance,
                section: item.section,
                suggestion: item.suggestion
            }));
        console.log(`[AI] keywordBooster done — ${keywords.length} keyword(s) via ${model}`);
        return {
            keywords
        };
    }),
    achievementBuilder: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(achievementBuilderInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const data = getResumeData(resume);
        const experiences = data.experiences ?? [];
        if (input.experienceIndex >= experiences.length) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "BAD_REQUEST",
                message: "Experience not found."
            });
        }
        const exp = experiences[input.experienceIndex];
        if (!exp.description?.trim()) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "BAD_REQUEST",
                message: "Experience has no description to improve."
            });
        }
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildAchievementBuilderPrompt"])(exp.jobTitle || "", exp.employer || "", exp.description, input.targetRole);
        console.log(`[AI] achievementBuilder — experience: ${exp.jobTitle} at ${exp.employer}`);
        const { content: bullets, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            maxTokens: 1500,
            temperature: 0.7
        });
        console.log(`[AI] achievementBuilder done — model: ${model}`);
        return {
            bullets
        };
    }),
    chatbotReply: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(chatbotReplyInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$chatbot$2d$policy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isProgrammingRelated"])(input.message)) {
            return {
                reply: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$chatbot$2d$policy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CHATBOT_NO_CODE_REPLY"],
                blocked: true
            };
        }
        const historyMessages = (input.history ?? []).map((item)=>({
                role: item.role,
                content: item.content
            }));
        const { content, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "system",
                    content: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$chatbot$2d$policy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CHATBOT_SYSTEM_PROMPT"]
                },
                ...historyMessages,
                {
                    role: "user",
                    content: input.message
                }
            ],
            maxTokens: 900,
            temperature: 0.7
        });
        console.log(`[AI] chatbotReply done - model: ${model}`);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$chatbot$2d$policy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["looksLikeCodeOutput"])(content)) {
            return {
                reply: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$chatbot$2d$policy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CHATBOT_NO_CODE_REPLY"],
                blocked: true
            };
        }
        return {
            reply: content,
            blocked: false
        };
    }),
    coverLetter: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(coverLetterInput).mutation(async ({ ctx, input })=>{
        await requirePremiumPlan(ctx.db, ctx.user.id);
        const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const data = getResumeData(resume);
        const textFields = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractResumeTextFields"])(data);
        const resumeText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatFieldsForPrompt"])(textFields);
        const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildCoverLetterPrompt"])(resumeText, input.jobDescription, input.companyName, input.tone);
        console.log(`[AI] coverLetter — resumeId: ${input.resumeId}, tone: ${input.tone}`);
        const { content: letter, model } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callWithFallback"])({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            maxTokens: 2000,
            temperature: 0.7
        });
        console.log(`[AI] coverLetter done — model: ${model}`);
        return {
            letter
        };
    })
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/app/lib/types/cover-letter.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_COVER_LETTER_TEMPLATE_ID",
    ()=>DEFAULT_COVER_LETTER_TEMPLATE_ID,
    "coverLetterTemplateIds",
    ()=>coverLetterTemplateIds,
    "createEmptyCoverLetterData",
    ()=>createEmptyCoverLetterData,
    "isCoverLetterTemplateId",
    ()=>isCoverLetterTemplateId,
    "normalizeCoverLetterData",
    ()=>normalizeCoverLetterData
]);
const coverLetterTemplateIds = [
    "modern-ats",
    "professional",
    "executive",
    "minimal-serif",
    "clean-block",
    "sidebar-contact",
    "elegant-line"
];
const DEFAULT_COVER_LETTER_TEMPLATE_ID = "modern-ats";
const isCoverLetterTemplateId = (value)=>!!value && coverLetterTemplateIds.includes(value);
const createEmptyCoverLetterData = ()=>({
        contact: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            city: ""
        },
        employer: {
            hiringManagerName: "",
            companyName: "",
            companyAddress: "",
            jobTitle: ""
        },
        content: "",
        date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }),
        templateId: DEFAULT_COVER_LETTER_TEMPLATE_ID
    });
const normalizeCoverLetterData = (raw)=>{
    const fallback = createEmptyCoverLetterData();
    return {
        contact: {
            ...fallback.contact,
            ...raw?.contact ?? {}
        },
        employer: {
            ...fallback.employer,
            ...raw?.employer ?? {}
        },
        content: raw?.content ?? fallback.content,
        date: raw?.date ?? fallback.date,
        templateId: isCoverLetterTemplateId(raw?.templateId) ? raw.templateId : fallback.templateId
    };
};
}),
"[project]/apps/app/trpc/routers/coverLetter.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "coverLetterRouter",
    ()=>coverLetterRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/select.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-D4V22yc5.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/init.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/cover-letters.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$types$2f$cover$2d$letter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/lib/types/cover-letter.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
const contactSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    firstName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    lastName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    address: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    city: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const employerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    hiringManagerName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    companyName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    companyAddress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    jobTitle: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const coverLetterDataSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    contact: contactSchema,
    employer: employerSchema,
    content: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$types$2f$cover$2d$letter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetterTemplateIds"]).optional()
});
const updateCoverLetterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    data: coverLetterDataSchema,
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional()
});
async function assertCanCreateCoverLetter(db, userId) {
    const user = await db.query.users.findFirst({
        where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, userId)
    });
    if (!user) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "NOT_FOUND",
            message: "User not found"
        });
    }
    const plan = user.plan ?? "free";
    const createdCount = user.coverLetterCreatedCount ?? 0;
    const limit = plan === "free" ? 1 : plan === "plus" ? 20 : null;
    if (limit !== null && createdCount >= limit) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "FORBIDDEN",
            message: `You've reached your ${plan.toUpperCase()} plan limit. Upgrade your plan to create more cover letter templates.`
        });
    }
    return user;
}
const coverLetterRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCRouter"])({
    list: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const rows = await ctx.db.query.coverLetters.findMany({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].userId, ctx.user.id),
            orderBy: [
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["desc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].updatedAt)
            ]
        });
        return rows.map((row)=>({
                ...row,
                data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$types$2f$cover$2d$letter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeCoverLetterData"])(row.data)
            }));
    }),
    getById: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).query(async ({ ctx, input })=>{
        const row = await ctx.db.query.coverLetters.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].id, input.id)
        });
        if (!row) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Cover letter not found"
            });
        }
        if (row.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this cover letter"
            });
        }
        return {
            ...row,
            data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$types$2f$cover$2d$letter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeCoverLetterData"])(row.data)
        };
    }),
    create: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        data: coverLetterDataSchema,
        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional()
    })).mutation(async ({ ctx, input })=>{
        const user = await assertCanCreateCoverLetter(ctx.db, ctx.user.id);
        const id = crypto.randomUUID();
        const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$types$2f$cover$2d$letter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeCoverLetterData"])(input.data);
        const derivedTitle = input.title?.trim() || (data.employer.jobTitle.trim() ? `Cover letter — ${data.employer.jobTitle.trim()}` : data.employer.companyName.trim() ? `Cover letter — ${data.employer.companyName.trim()}` : `Cover letter — ${new Date().toLocaleDateString()}`);
        await ctx.db.insert(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"]).values({
            id,
            userId: ctx.user.id,
            title: derivedTitle,
            data,
            updatedAt: new Date()
        });
        await ctx.db.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).set({
            coverLetterCreatedCount: (user.coverLetterCreatedCount ?? 0) + 1,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id));
        return {
            id
        };
    }),
    update: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(updateCoverLetterSchema).mutation(async ({ ctx, input })=>{
        const existing = await ctx.db.query.coverLetters.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].id, input.id)
        });
        if (!existing) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Cover letter not found"
            });
        }
        if (existing.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this cover letter"
            });
        }
        const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$types$2f$cover$2d$letter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeCoverLetterData"])(input.data);
        const derivedTitle = input.title?.trim() || (data.employer.jobTitle.trim() ? `Cover letter — ${data.employer.jobTitle.trim()}` : data.employer.companyName.trim() ? `Cover letter — ${data.employer.companyName.trim()}` : `Cover letter — ${new Date().toLocaleDateString()}`);
        await ctx.db.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"]).set({
            title: derivedTitle,
            data,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].id, input.id));
        return {
            success: true,
            id: input.id
        };
    }),
    delete: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        const existing = await ctx.db.query.coverLetters.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].id, input.id)
        });
        if (!existing) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Cover letter not found"
            });
        }
        if (existing.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this cover letter"
            });
        }
        await ctx.db.delete(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].id, input.id));
        return {
            success: true
        };
    }),
    duplicate: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        const user = await assertCanCreateCoverLetter(ctx.db, ctx.user.id);
        const existing = await ctx.db.query.coverLetters.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].id, input.id)
        });
        if (!existing) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Cover letter not found"
            });
        }
        if (existing.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this cover letter"
            });
        }
        const id = crypto.randomUUID();
        const normalizedData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$lib$2f$types$2f$cover$2d$letter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeCoverLetterData"])(existing.data);
        await ctx.db.insert(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"]).values({
            id,
            userId: ctx.user.id,
            title: `${existing.title} (Copy)`,
            data: normalizedData,
            updatedAt: new Date()
        });
        await ctx.db.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).set({
            coverLetterCreatedCount: (user.coverLetterCreatedCount ?? 0) + 1,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id));
        return {
            id
        };
    })
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/app/trpc/routers/resume.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "resumeRouter",
    ()=>resumeRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/select.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-D4V22yc5.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/init.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/resumes.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
function splitTitleBaseAndIndex(title) {
    const match = title.match(/^(.*?)(?:_(\d+))?$/);
    const rawBase = match?.[1]?.trim() || title.trim();
    const base = rawBase || "Resume";
    const index = match?.[2] ? parseInt(match[2], 10) : null;
    return {
        base,
        index: Number.isNaN(index) ? null : index
    };
}
async function getUniqueResumeTitle(args) {
    const requested = args.requestedTitle.trim() || "Resume_1";
    const existingResumes = await args.db.query.resumes.findMany({
        where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].userId, args.userId)
    });
    const existingTitles = new Set(existingResumes.filter((r)=>args.excludeId ? r.id !== args.excludeId : true).map((r)=>(r.title || "").trim().toLowerCase()));
    if (!existingTitles.has(requested.toLowerCase())) {
        return requested;
    }
    const { base, index } = splitTitleBaseAndIndex(requested);
    let next = index ?? 1;
    while(existingTitles.has(`${base}_${next}`.toLowerCase())){
        next += 1;
    }
    return `${base}_${next}`;
}
async function assertCanCreateResume(db, userId) {
    const user = await db.query.users.findFirst({
        where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, userId)
    });
    if (!user) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "NOT_FOUND",
            message: "User not found"
        });
    }
    const plan = user.plan ?? "free";
    const createdCount = user.resumeCreatedCount ?? 0;
    const limit = plan === "free" ? 1 : plan === "plus" ? 20 : null;
    if (limit !== null && createdCount >= limit) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
            code: "FORBIDDEN",
            message: `You've reached your ${plan.toUpperCase()} plan limit. Upgrade your plan to create more resume templates.`
        });
    }
    return user;
}
// Validation schemas
const contactSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    firstName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    lastName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    desiredJobTitle: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""))
});
const experienceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    jobTitle: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    employer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    location: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    startDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    endDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    isCurrentJob: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const educationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    schoolName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    location: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    degree: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    startDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    endDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const skillSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    level: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert"
    ]),
    showLevel: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
const languageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    proficiency: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Basic",
        "Conversational",
        "Fluent",
        "Native"
    ])
});
const certificationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    issuer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const awardSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    issuer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    date: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const websiteSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    label: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    url: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const referenceSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    company: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const hobbySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const customSectionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    sectionName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const finalizeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    languages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(languageSchema),
    certifications: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(certificationSchema),
    awards: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(awardSchema),
    websites: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(websiteSchema),
    references: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(referenceSchema),
    hobbies: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(hobbySchema),
    customSections: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(customSectionSchema)
});
const resumeDataSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    contact: contactSchema,
    experiences: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(experienceSchema),
    educations: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(educationSchema),
    skills: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(skillSchema),
    summary: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    finalize: finalizeSchema
});
const createResumeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Title is required"),
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Template is required")
});
const updateResumeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    data: resumeDataSchema.optional(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "draft",
        "completed"
    ]).optional(),
    lastEditedSection: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const resumeRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCRouter"])({
    /**
   * List all resumes for the current user
   */ list: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userResumes = await ctx.db.query.resumes.findMany({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].userId, ctx.user.id),
            orderBy: [
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["desc"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].updatedAt)
            ]
        });
        return userResumes;
    }),
    /**
   * Get a single resume by ID
   */ getById: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).query(async ({ ctx, input })=>{
        const resume = await ctx.db.query.resumes.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].id, input.id)
        });
        if (!resume) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Resume not found"
            });
        }
        // Ensure user owns this resume
        if (resume.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this resume"
            });
        }
        return resume;
    }),
    /**
   * Create a new resume
   */ create: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(createResumeSchema).mutation(async ({ ctx, input })=>{
        const user = await assertCanCreateResume(ctx.db, ctx.user.id);
        const id = crypto.randomUUID();
        const title = await getUniqueResumeTitle({
            db: ctx.db,
            userId: ctx.user.id,
            requestedTitle: input.title
        });
        const emptyData = {
            contact: {
                firstName: "",
                lastName: "",
                desiredJobTitle: "",
                phone: "",
                email: ""
            },
            experiences: [],
            educations: [],
            skills: [],
            summary: "",
            finalize: {
                languages: [],
                certifications: [],
                awards: [],
                websites: [],
                references: [],
                hobbies: [],
                customSections: []
            }
        };
        await ctx.db.insert(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"]).values({
            id,
            userId: ctx.user.id,
            title,
            templateId: input.templateId,
            data: emptyData,
            status: "draft"
        });
        await ctx.db.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).set({
            resumeCreatedCount: (user.resumeCreatedCount ?? 0) + 1,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id));
        return {
            id,
            title
        };
    }),
    /**
   * Update an existing resume
   */ update: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(updateResumeSchema).mutation(async ({ ctx, input })=>{
        // First, verify the resume exists and belongs to user
        const existingResume = await ctx.db.query.resumes.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].id, input.id)
        });
        if (!existingResume) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Resume not found"
            });
        }
        if (existingResume.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this resume"
            });
        }
        // Build update object
        const updateData = {
            updatedAt: new Date()
        };
        if (input.title !== undefined) {
            updateData.title = await getUniqueResumeTitle({
                db: ctx.db,
                userId: ctx.user.id,
                requestedTitle: input.title,
                excludeId: input.id
            });
        }
        if (input.templateId !== undefined) updateData.templateId = input.templateId;
        if (input.data !== undefined) updateData.data = input.data;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.lastEditedSection !== undefined) {
            updateData.lastEditedSection = input.lastEditedSection;
        }
        await ctx.db.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"]).set(updateData).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].id, input.id));
        return {
            success: true,
            title: updateData.title ?? existingResume.title
        };
    }),
    /**
   * Delete a resume
   */ delete: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        const existingResume = await ctx.db.query.resumes.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].id, input.id)
        });
        if (!existingResume) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Resume not found"
            });
        }
        if (existingResume.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this resume"
            });
        }
        await ctx.db.delete(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].id, input.id));
        return {
            success: true
        };
    }),
    /**
   * Duplicate a resume
   */ duplicate: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
    })).mutation(async ({ ctx, input })=>{
        const user = await assertCanCreateResume(ctx.db, ctx.user.id);
        const existingResume = await ctx.db.query.resumes.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].id, input.id)
        });
        if (!existingResume) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "Resume not found"
            });
        }
        if (existingResume.userId !== ctx.user.id) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: "You don't have access to this resume"
            });
        }
        const newId = crypto.randomUUID();
        await ctx.db.insert(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"]).values({
            id: newId,
            userId: ctx.user.id,
            title: `${existingResume.title} (Copy)`,
            templateId: existingResume.templateId,
            data: existingResume.data,
            status: "draft"
        });
        await ctx.db.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).set({
            resumeCreatedCount: (user.resumeCreatedCount ?? 0) + 1,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id));
        return {
            id: newId
        };
    })
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/app/trpc/routers/user.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "userRouter",
    ()=>userRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/tracked-D4V22yc5.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/init.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/db/schema/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/users.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/resumes.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/cover-letters.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/db/schema/processed-transactions.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
function getEffectivePlan(user) {
    if (!user.isPaid) return "free";
    return user.plan ?? "free";
}
function findValueDeep(value, predicate) {
    if (Array.isArray(value)) {
        return value.some((entry)=>findValueDeep(entry, predicate));
    }
    if (value && typeof value === "object") {
        return Object.entries(value).some(([key, val])=>predicate(key, val) || findValueDeep(val, predicate));
    }
    return false;
}
function extractPaddleTransaction(data) {
    if (!data || typeof data !== "object") return {};
    const root = data;
    if (root.data && typeof root.data === "object") return root.data;
    return root;
}
function collectPriceIds(value) {
    const found = new Set();
    const visit = (node)=>{
        if (Array.isArray(node)) {
            for (const item of node)visit(item);
            return;
        }
        if (!node || typeof node !== "object") return;
        for (const [key, nested] of Object.entries(node)){
            if (typeof nested === "string") {
                const normalizedKey = key.toLowerCase();
                if (nested.startsWith("pri_") && (normalizedKey === "price_id" || normalizedKey === "priceid" || normalizedKey === "id")) {
                    found.add(nested);
                }
            } else {
                visit(nested);
            }
        }
    };
    visit(value);
    return [
        ...found
    ];
}
function isTransactionUniqueConstraintError(error) {
    if (!error || typeof error !== "object") return false;
    const message = "message" in error ? String(error.message) : "";
    return message.includes("processed_transactions.transaction_id");
}
const userRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCRouter"])({
    /**
   * Get current authenticated user
   */ me: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const user = await ctx.db.query.users.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id)
        });
        return user ?? null;
    }),
    /**
   * Get user's OAuth providers
   */ getProviders: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userAccounts = await ctx.db.query.accounts.findMany({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["accounts"].userId, ctx.user.id)
        });
        return userAccounts.map((account)=>({
                providerId: account.providerId
            }));
    }),
    /**
   * Get user stats for dashboard
   */ stats: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const userResumes = await ctx.db.query.resumes.findMany({
            where: (resumes, { eq })=>eq(resumes.userId, ctx.user.id)
        });
        const totalResumes = userResumes.length;
        const completedResumes = userResumes.filter((r)=>r.status === "completed").length;
        const draftResumes = userResumes.filter((r)=>r.status === "draft").length;
        return {
            totalResumes,
            completedResumes,
            draftResumes
        };
    }),
    subscription: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].query(async ({ ctx })=>{
        const user = await ctx.db.query.users.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id)
        });
        if (!user) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "NOT_FOUND",
                message: "User not found"
            });
        }
        const plan = getEffectivePlan(user);
        const resumeCreated = user.resumeCreatedCount ?? 0;
        const coverLetterCreated = user.coverLetterCreatedCount ?? 0;
        const limit = plan === "free" ? 1 : plan === "plus" ? 20 : null;
        return {
            plan,
            isPaid: !!user.isPaid,
            status: user.isPaid ? "active" : "inactive",
            resumeCreatedCount: resumeCreated,
            resumeCreationLimit: limit,
            coverLetterCreatedCount: coverLetterCreated,
            coverLetterCreationLimit: limit
        };
    }),
    confirmCheckout: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].input(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        plan: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            "plus",
            "pro"
        ]),
        transactionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3)
    })).mutation(async ({ ctx, input })=>{
        const alreadyProcessed = await ctx.db.query.processedTransactions.findFirst({
            where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processedTransactions"].transactionId, input.transactionId)
        });
        if (alreadyProcessed) {
            if (alreadyProcessed.userId !== ctx.user.id) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                    code: "FORBIDDEN",
                    message: "This transaction is already linked to another account."
                });
            }
            return {
                success: true,
                plan: alreadyProcessed.plan,
                alreadyProcessed: true
            };
        }
        const paddleApiKey = process.env.PADDLE_API_KEY;
        const paddleEnv = ("TURBOPACK compile-time value", "sandbox") ?? "sandbox";
        const expectedPriceId = input.plan === "plus" ? ("TURBOPACK compile-time value", "pri_01kpnjs4t7r7dvxen629rbzfbj") : ("TURBOPACK compile-time value", "pri_01kpnjt2kqgs9mejmhpzw970c4");
        if (!paddleApiKey) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "PRECONDITION_FAILED",
                message: "Missing PADDLE_API_KEY on server."
            });
        }
        if (!expectedPriceId) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "PRECONDITION_FAILED",
                message: `Missing Paddle price ID for ${input.plan}.`
            });
        }
        const baseUrl = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : "https://sandbox-api.paddle.com";
        const fetchPaddleTransaction = async ()=>{
            let lastStatus = 0;
            for(let attempt = 0; attempt < 3; attempt += 1){
                const response = await fetch(`${baseUrl}/transactions/${input.transactionId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${paddleApiKey}`,
                        "Content-Type": "application/json"
                    }
                });
                lastStatus = response.status;
                if (response.ok) {
                    return await response.json();
                }
                // Paddle can be eventually consistent right after checkout.complete
                await new Promise((resolve)=>setTimeout(resolve, 500 * (attempt + 1)));
            }
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "BAD_REQUEST",
                message: `Unable to verify Paddle transaction (status ${lastStatus}).`
            });
        };
        const payload = await fetchPaddleTransaction();
        const tx = extractPaddleTransaction(payload);
        const statusMatches = findValueDeep(tx, (key, val)=>{
            if (typeof val !== "string") return false;
            const normalizedKey = key.toLowerCase();
            const normalizedVal = val.toLowerCase();
            if (normalizedKey !== "status" && normalizedKey !== "transaction_status") return false;
            return normalizedVal.includes("complete") || normalizedVal.includes("paid") || normalizedVal.includes("billed");
        });
        const priceIds = collectPriceIds(tx);
        const priceMatches = priceIds.includes(expectedPriceId);
        if (!statusMatches || !priceMatches) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                code: "FORBIDDEN",
                message: `Paddle transaction did not match the selected plan. expected=${expectedPriceId} found=${priceIds.join(",") || "none"}`
            });
        }
        const applyPlanUpgrade = async ()=>{
            return ctx.db.transaction(async (tx)=>{
                const existing = await tx.query.processedTransactions.findFirst({
                    where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processedTransactions"].transactionId, input.transactionId)
                });
                if (existing) {
                    if (existing.userId !== ctx.user.id) {
                        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                            code: "FORBIDDEN",
                            message: "This transaction is already linked to another account."
                        });
                    }
                    return {
                        success: true,
                        plan: existing.plan,
                        alreadyProcessed: true
                    };
                }
                await tx.insert(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processedTransactions"]).values({
                    id: crypto.randomUUID(),
                    userId: ctx.user.id,
                    provider: "paddle",
                    transactionId: input.transactionId,
                    plan: input.plan,
                    status: "completed"
                });
                await tx.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).set({
                    plan: input.plan,
                    isPaid: true,
                    updatedAt: new Date()
                }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id));
                return {
                    success: true,
                    plan: input.plan,
                    alreadyProcessed: false
                };
            });
        };
        try {
            return await applyPlanUpgrade();
        } catch (error) {
            if (!isTransactionUniqueConstraintError(error)) {
                throw error;
            }
            const existing = await ctx.db.query.processedTransactions.findFirst({
                where: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$processed$2d$transactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["processedTransactions"].transactionId, input.transactionId)
            });
            if (!existing) {
                throw error;
            }
            if (existing.userId !== ctx.user.id) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$tracked$2d$D4V22yc5$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRPCError"]({
                    code: "FORBIDDEN",
                    message: "This transaction is already linked to another account."
                });
            }
            return {
                success: true,
                plan: existing.plan,
                alreadyProcessed: true
            };
        }
    }),
    cancelPlan: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].mutation(async ({ ctx })=>{
        await ctx.db.update(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).set({
            plan: "free",
            isPaid: false,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id));
        return {
            success: true
        };
    }),
    /**
   * Delete user account and all associated data
   */ deleteAccount: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["protectedProcedure"].mutation(async ({ ctx })=>{
        await ctx.db.delete(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$cover$2d$letters$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetters"].userId, ctx.user.id));
        // Delete user's resumes first (cascade should handle this, but being explicit)
        await ctx.db.delete(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$resumes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumes"].userId, ctx.user.id));
        // Delete user's accounts (OAuth connections)
        await ctx.db.delete(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["accounts"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["accounts"].userId, ctx.user.id));
        // Delete user's sessions
        await ctx.db.delete(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessions"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sessions"].userId, ctx.user.id));
        // Finally, delete the user
        await ctx.db.delete(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$db$2f$schema$2f$users$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, ctx.user.id));
        return {
            success: true
        };
    })
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/app/trpc/root.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "appRouter",
    ()=>appRouter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/init.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/routers/ai.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$coverLetter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/routers/coverLetter.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$resume$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/routers/resume.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/routers/user.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$coverLetter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$resume$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$coverLetter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$resume$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
const appRouter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCRouter"])({
    user: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["userRouter"],
    resume: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$resume$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resumeRouter"],
    coverLetter: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$coverLetter$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coverLetterRouter"],
    ai: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$routers$2f$ai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["aiRouter"]
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/app/trpc/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
/**
 * tRPC Server Barrel Export
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/root.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/init.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/app/app/api/trpc/[trpc]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>handler,
    "POST",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$fetch$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@trpc/server/dist/adapters/fetch/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/app/trpc/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/root.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/app/trpc/init.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
/**
 * tRPC HTTP Handler
 * Handles all tRPC requests at /api/trpc/*
 */ const handler = (req)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$trpc$2f$server$2f$dist$2f$adapters$2f$fetch$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fetchRequestHandler"])({
        endpoint: "/api/trpc",
        req,
        router: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$root$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appRouter"],
        createContext: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$app$2f$trpc$2f$init$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTRPCContext"],
        onError: ("TURBOPACK compile-time truthy", 1) ? ({ path, error })=>{
            console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
        } : "TURBOPACK unreachable"
    });
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0n3o7da._.js.map