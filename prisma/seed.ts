import { pathToFileURL } from "node:url";

import type { PrismaClient } from "@/generated/prisma/client";
import { EventSeatStatus } from "@/generated/prisma/enums";
import { createPrismaClient } from "@/lib/db/client";
import { getServerEnv } from "@/lib/env/validation";
import { createBetterAuth } from "@/modules/auth/auth-factory";
import type { UserRole } from "@/modules/auth/auth.types";

export const demoPassword = "ProjecaoDemo2026!";

const posterFallbackPath = "/placeholders/poster-unavailable.png";

type SeedEventDefinition = {
  externalId: number;
  id: string;
  movie: { overview: string; title: string };
  priceCents: number;
  published: boolean;
  roomName: string;
  rows: number;
  seatsPerRow: number;
  soldSeatLabels: readonly string[];
  startsInDays: number;
  venueName: string;
};

const seedEventDefinitions = [
  {
    externalId: 129,
    id: "seed-event-spirited-away",
    movie: {
      overview:
        "Uma jovem atravessa um mundo de espíritos e descobre a coragem de voltar para casa.",
      title: "A Viagem de Chihiro",
    },
    priceCents: 3200,
    published: true,
    roomName: "Sala 1",
    rows: 4,
    seatsPerRow: 6,
    startsInDays: 12,
    venueName: "Cine Projeção",
    soldSeatLabels: ["C3", "C4"],
  },
  {
    externalId: 111,
    id: "seed-event-paris-texas",
    movie: {
      overview:
        "Um homem reaparece no deserto e percorre o caminho de volta aos afetos que deixou para trás.",
      title: "Paris, Texas",
    },
    priceCents: 3600,
    published: true,
    roomName: "Sala 2",
    rows: 5,
    seatsPerRow: 5,
    startsInDays: 19,
    venueName: "Cine Projeção",
    soldSeatLabels: ["B2"],
  },
  {
    externalId: 497,
    id: "seed-event-archive",
    movie: {
      overview: "Uma sessão de arquivo mantida apenas para verificar a curadoria passada.",
      title: "Arquivo da Projeção",
    },
    priceCents: 2800,
    published: true,
    roomName: "Sala 1",
    rows: 3,
    seatsPerRow: 4,
    startsInDays: -4,
    venueName: "Cine Projeção",
    soldSeatLabels: [],
  },
  {
    externalId: 822,
    id: "seed-event-draft",
    movie: {
      overview: "Uma sessão em preparação que ainda não pertence à programação pública.",
      title: "Rascunho de Programação",
    },
    priceCents: 3000,
    published: false,
    roomName: "Sala 2",
    rows: 3,
    seatsPerRow: 4,
    startsInDays: 26,
    venueName: "Cine Projeção",
    soldSeatLabels: [],
  },
] as const satisfies readonly SeedEventDefinition[];

const demoUsers: ReadonlyArray<{
  email: string;
  name: string;
  role: UserRole;
}> = [
  {
    email: "organizador@projecao.local",
    name: "Organizador Demo",
    role: "ORGANIZER",
  },
  {
    email: "cliente1@projecao.local",
    name: "Cliente Demo 1",
    role: "CUSTOMER",
  },
  {
    email: "cliente2@projecao.local",
    name: "Cliente Demo 2",
    role: "CUSTOMER",
  },
  {
    email: "portaria@projecao.local",
    name: "Portaria Demo",
    role: "GATE",
  },
];

export async function seedDemoUsers(database: PrismaClient): Promise<void> {
  const environment = getServerEnv();
  const seedAuth = createBetterAuth({
    allowSignUp: true,
    database,
    environment,
  });

  for (const demoUser of demoUsers) {
    const existingUser = await database.user.findUnique({
      where: { email: demoUser.email },
    });

    if (!existingUser) {
      await seedAuth.api.signUpEmail({
        body: {
          email: demoUser.email,
          name: demoUser.name,
          password: demoPassword,
        },
      });
    }

    await database.user.update({
      data: {
        emailVerified: true,
        name: demoUser.name,
        role: demoUser.role,
      },
      where: { email: demoUser.email },
    });
  }
}

function getSeedStartAt(daysFromNow: number, hour: number): Date {
  const startsAt = new Date();

  startsAt.setUTCDate(startsAt.getUTCDate() + daysFromNow);
  startsAt.setUTCHours(hour, 0, 0, 0);

  return startsAt;
}

function getRowLabel(rowIndex: number): string {
  return String.fromCharCode("A".charCodeAt(0) + rowIndex);
}

export async function seedDemoEvents(database: PrismaClient): Promise<void> {
  const organizer = await database.user.findUniqueOrThrow({
    where: { email: "organizador@projecao.local" },
  });

  for (const definition of seedEventDefinitions) {
    const movieSnapshot = await database.movieSnapshot.upsert({
      create: {
        externalId: definition.externalId,
        overview: definition.movie.overview,
        posterPath: posterFallbackPath,
        source: "TMDB",
        title: definition.movie.title,
      },
      update: {
        overview: definition.movie.overview,
        posterPath: posterFallbackPath,
        title: definition.movie.title,
      },
      where: {
        source_externalId: {
          externalId: definition.externalId,
          source: "TMDB",
        },
      },
    });
    const startsAt = getSeedStartAt(
      definition.startsInDays,
      definition.externalId === 111 ? 23 : 22,
    );
    const capacity = definition.rows * definition.seatsPerRow;
    const soldSeatLabels: readonly string[] = definition.soldSeatLabels;

    await database.event.upsert({
      create: {
        capacity,
        id: definition.id,
        movieSnapshotId: movieSnapshot.id,
        organizerId: organizer.id,
        priceCents: definition.priceCents,
        publishedAt: definition.published ? startsAt : null,
        roomName: definition.roomName,
        rows: definition.rows,
        seatsPerRow: definition.seatsPerRow,
        startsAt,
        status: definition.published ? "PUBLISHED" : "DRAFT",
        venueName: definition.venueName,
      },
      update: {
        capacity,
        movieSnapshotId: movieSnapshot.id,
        organizerId: organizer.id,
        priceCents: definition.priceCents,
        publishedAt: definition.published ? startsAt : null,
        roomName: definition.roomName,
        rows: definition.rows,
        seatsPerRow: definition.seatsPerRow,
        startsAt,
        status: definition.published ? "PUBLISHED" : "DRAFT",
        venueName: definition.venueName,
      },
      where: { id: definition.id },
    });

    await database.eventSeat.deleteMany({ where: { eventId: definition.id } });
    await database.eventSeat.createMany({
      data: Array.from({ length: definition.rows }, (_, rowIndex) => {
        const rowLabel = getRowLabel(rowIndex);

        return Array.from({ length: definition.seatsPerRow }, (_, seatIndex) => {
          const seatNumber = seatIndex + 1;
          const label = `${rowLabel}${seatNumber}`;

          return {
            eventId: definition.id,
            label,
            rowLabel,
            seatNumber,
            status: soldSeatLabels.includes(label)
              ? EventSeatStatus.SOLD
              : EventSeatStatus.AVAILABLE,
          };
        });
      }).flat(),
    });
  }
}

export async function seedDemoData(database: PrismaClient): Promise<void> {
  await seedDemoUsers(database);
  await seedDemoEvents(database);
}

async function main() {
  const environment = getServerEnv();
  const database = createPrismaClient(environment.DATABASE_URL);

  try {
    await seedDemoData(database);
  } finally {
    await database.$disconnect();
  }
}

const executedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (executedDirectly) {
  main()
    .then(() => {
      console.info("Dados de demonstração semeados com sucesso.");
    })
    .catch((error: unknown) => {
      console.error("Falha ao semear usuários de demonstração.");
      console.error(error);
      process.exitCode = 1;
    });
}
