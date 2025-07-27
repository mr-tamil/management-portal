import type { Service, User, Role } from "@/types";

export const allUsers: User[] = [
    {
        id: "usr_1",
        name: "Alice Johnson",
        email: "alice.j@example.com",
        roles: ["Admin"],
        lastActive: "May 21, 2024, 2:15 PM",
    },
    {
        id: "usr_2",
        name: "Bob Williams",
        email: "bob.w@example.com",
        roles: ["User"],
        lastActive: "May 21, 2024, 11:45 AM",
    },
    {
        id: "usr_3",
        name: "Charlie Brown",
        email: "charlie.b@example.com",
        roles: ["User"],
        lastActive: "May 20, 2024, 8:00 PM",
    },
    {
        id: "usr_4",
        name: "Diana Prince",
        email: "diana.p@example.com",
        roles: ["Admin"],
        lastActive: "May 18, 2024, 9:30 AM",
    },
    {
        id: "usr_5",
        name: "Ethan Hunt",
        email: "ethan.h@example.com",
        roles: ["User"],
        lastActive: "May 21, 2024, 10:05 AM",
    },
    {
        id: "usr_6",
        name: "Fiona Glenanne",
        email: "fiona.g@example.com",
        roles: ["User"],
        lastActive: "May 20, 2024, 6:20 PM",
    },
    {
        id: "usr_7",
        name: "George Costanza",
        email: "george.c@example.com",
        roles: ["Admin"],
        lastActive: "May 7, 2024, 11:00 AM",
    },
];

export const services: Service[] = [
    {
        id: "rms-analysis",
        name: "RMS Analysis",
        description: "Service for analyzing retail management systems data.",
        admins: [allUsers[0], allUsers[3]], // Alice, Diana
        users: [allUsers[1], allUsers[2]] // Bob, Charlie
    },
    {
        id: "e-commerce-platform",
        name: "E-commerce Platform",
        description: "Our primary online marketplace backend.",
        admins: [allUsers[3]], // Diana
        users: [allUsers[2], allUsers[4], allUsers[5]] // Charlie, Ethan, Fiona
    },
    {
        id: "mobile-game-backend",
        name: "Mobile Game Backend",
        description: "Backend services for the new mobile game.",
        admins: [allUsers[0], allUsers[6]], // Alice, George
        users: [allUsers[4]] // Ethan
    },
];

export const allRoles: Role[] = ["Admin", "User"];

// Adding this export as a workaround for a persistent build cache issue.
export const users = allUsers;
