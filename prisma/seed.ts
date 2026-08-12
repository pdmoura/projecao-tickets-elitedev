import { pathToFileURL } from "node:url";

import type { PrismaClient } from "@/generated/prisma/client";
import { EventSeatStatus } from "@/generated/prisma/enums";
import { createPrismaClient } from "@/lib/db/client";
import { loadProjectEnv } from "@/lib/env/load-project-env";
import { getServerEnv } from "@/lib/env/validation";
import { createBetterAuth } from "@/modules/auth/auth-factory";
import type { UserRole } from "@/modules/auth/auth.types";

export const demoPassword = "ProjecaoDemo2026!";

const tmdbImageBaseUrl = "https://image.tmdb.org/t/p/w500";

type SeedEventDefinition = {
  externalId: number;
  id: string;
  movie: {
    backdropPath: string | null;
    overview: string;
    posterPath: string;
    releaseDate: string;
    title: string;
  };
  priceCents: number;
  published: boolean;
  roomName: string;
  rows: number;
  seatsPerRow: number;
  soldSeatLabels: readonly string[];
  startsInDays: number;
  venueName: string;
};

// Snapshot curado da TMDb, mantido no repositório para que o seed seja offline.
const seedEventDefinitions = [
  {
    externalId: 129,
    id: "seed-event-spirited-away",
    movie: {
      backdropPath: `${tmdbImageBaseUrl}/m4TUa2ciEWSlk37rOsjiSIvZDXE.jpg`,
      overview:
        "Chihiro se muda com os pais e entra em um mundo de espíritos. Para voltar, ela precisa encontrar coragem em meio a estranhas criaturas.",
      posterPath: `${tmdbImageBaseUrl}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`,
      releaseDate: "2001-07-20",
      title: "A Viagem de Chihiro",
    },
    priceCents: 3200,
    published: true,
    roomName: "Sala 1",
    rows: 4,
    seatsPerRow: 6,
    soldSeatLabels: ["C3", "C4"],
    startsInDays: 12,
    venueName: "Cine Projeção",
  },
  {
    externalId: 655,
    id: "seed-event-paris-texas",
    movie: {
      backdropPath: `${tmdbImageBaseUrl}/fWrq3u16gaBJ6nYNWcR3XaOhQPq.jpg`,
      overview:
        "Um homem é encontrado vagando pelo deserto do Texas e começa uma viagem para reencontrar o filho e encarar o passado.",
      posterPath: `${tmdbImageBaseUrl}/mYYdCi54E2xVbUxCr03tMookv9Z.jpg`,
      releaseDate: "1984-05-19",
      title: "Paris, Texas",
    },
    priceCents: 3600,
    published: true,
    roomName: "Sala 2",
    rows: 5,
    seatsPerRow: 5,
    soldSeatLabels: ["B2"],
    startsInDays: 19,
    venueName: "Cine Projeção",
  },
  {
    externalId: 25376,
    id: "seed-event-archive",
    movie: {
      backdropPath: `${tmdbImageBaseUrl}/fNHCogWhABNAmzk0IFdzQP5XLYj.jpg`,
      overview:
        "Em Buenos Aires, um oficial de justiça aposentado escreve sobre um assassinato que nunca conseguiu esquecer.",
      posterPath: `${tmdbImageBaseUrl}/pefOYP69bB3ZC6p6B3ZbWc46ioT.jpg`,
      releaseDate: "2009-08-13",
      title: "O Segredo dos Seus Olhos",
    },
    priceCents: 2800,
    published: true,
    roomName: "Sala 1",
    rows: 3,
    seatsPerRow: 4,
    soldSeatLabels: [],
    startsInDays: -4,
    venueName: "Cine Projeção",
  },
  {
    externalId: 194662,
    id: "seed-event-draft",
    movie: {
      backdropPath: `${tmdbImageBaseUrl}/s0OrExdg7i3RLR7oqzHRk4q2kL4.jpg`,
      overview:
        "Um ator em declínio tenta montar uma adaptação ambiciosa na Broadway enquanto enfrenta a própria identidade.",
      posterPath: `${tmdbImageBaseUrl}/rHUg2AuIuLSIYMYFgavVwqt1jtc.jpg`,
      releaseDate: "2014-08-27",
      title: "Birdman ou (A Inesperada Virtude da Ignorância)",
    },
    priceCents: 3000,
    published: false,
    roomName: "Sala 2",
    rows: 3,
    seatsPerRow: 4,
    soldSeatLabels: [],
    startsInDays: 26,
    venueName: "Cine Projeção",
  },
] as const satisfies readonly SeedEventDefinition[];

const demoUsers: ReadonlyArray<{
  email: string;
  name: string;
  role: UserRole;
}> = [
  { email: "organizador@projecao.local", name: "Organizador Demo", role: "ORGANIZER" },
  { email: "cliente1@projecao.local", name: "Cliente Demo 1", role: "CUSTOMER" },
  { email: "cliente2@projecao.local", name: "Cliente Demo 2", role: "CUSTOMER" },
  { email: "portaria@projecao.local", name: "Portaria Demo", role: "GATE" },
];

export async function seedDemoUsers(database: PrismaClient): Promise<void> {
  const environment = getServerEnv();
  const seedAuth = createBetterAuth({ allowSignUp: true, database, environment });

  for (const demoUser of demoUsers) {
    const existingUser = await database.user.findUnique({ where: { email: demoUser.email } });

    if (!existingUser) {
      await seedAuth.api.signUpEmail({
        body: { email: demoUser.email, name: demoUser.name, password: demoPassword },
      });
    }

    await database.user.update({
      data: { emailVerified: true, name: demoUser.name, role: demoUser.role },
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

function createSeedSeats(definition: SeedEventDefinition) {
  return Array.from({ length: definition.rows }, (_, rowIndex) => {
    const rowLabel = getRowLabel(rowIndex);

    return Array.from({ length: definition.seatsPerRow }, (_, seatIndex) => {
      const seatNumber = seatIndex + 1;
      const label = `${rowLabel}${seatNumber}`;

      return {
        eventId: definition.id,
        label,
        rowLabel,
        seatNumber,
        status: definition.soldSeatLabels.includes(label)
          ? EventSeatStatus.SOLD
          : EventSeatStatus.AVAILABLE,
      };
    });
  }).flat();
}

export async function seedDemoEvents(database: PrismaClient): Promise<void> {
  const organizer = await database.user.findUniqueOrThrow({
    where: { email: "organizador@projecao.local" },
  });

  for (const definition of seedEventDefinitions) {
    const movieSnapshot = await database.movieSnapshot.upsert({
      create: {
        backdropPath: definition.movie.backdropPath,
        externalId: definition.externalId,
        overview: definition.movie.overview,
        posterPath: definition.movie.posterPath,
        releaseDate: new Date(`${definition.movie.releaseDate}T00:00:00.000Z`),
        source: "TMDB",
        title: definition.movie.title,
      },
      update: {
        backdropPath: definition.movie.backdropPath,
        overview: definition.movie.overview,
        posterPath: definition.movie.posterPath,
        releaseDate: new Date(`${definition.movie.releaseDate}T00:00:00.000Z`),
        title: definition.movie.title,
      },
      where: {
        source_externalId: { externalId: definition.externalId, source: "TMDB" },
      },
    });
    const startsAt = getSeedStartAt(
      definition.startsInDays,
      definition.externalId === 655 ? 23 : 22,
    );

    await database.event.upsert({
      create: {
        capacity: definition.rows * definition.seatsPerRow,
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
        capacity: definition.rows * definition.seatsPerRow,
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

    // Nunca recria assentos já existentes: assim uma segunda execução não apaga compras.
    const existingSeatCount = await database.eventSeat.count({ where: { eventId: definition.id } });

    if (existingSeatCount === 0) {
      await database.eventSeat.createMany({ data: createSeedSeats(definition) });
    }
  }
}

export async function seedDemoData(database: PrismaClient): Promise<void> {
  await seedDemoUsers(database);
  await seedDemoEvents(database);
}

async function main() {
  loadProjectEnv();
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
    .then(() => console.info("Dados de demonstração semeados com sucesso."))
    .catch((error: unknown) => {
      console.error("Falha ao semear usuários de demonstração.");
      console.error(error);
      process.exitCode = 1;
    });
}
