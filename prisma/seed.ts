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
  startHour: number;
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
      title: "Spirited Away",
    },
    priceCents: 3200,
    published: true,
    roomName: "Sala 1",
    rows: 4,
    seatsPerRow: 6,
    soldSeatLabels: ["C3", "C4"],
    startHour: 18,
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
    startHour: 20,
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
      title: "El secreto de sus ojos",
    },
    priceCents: 2800,
    published: true,
    roomName: "Sala 1",
    rows: 3,
    seatsPerRow: 4,
    soldSeatLabels: [],
    startHour: 19,
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
      title: "Birdman",
    },
    priceCents: 3000,
    published: false,
    roomName: "Sala 2",
    rows: 3,
    seatsPerRow: 4,
    soldSeatLabels: [],
    startHour: 21,
    startsInDays: 26,
    venueName: "Cine Projeção",
  },
  {
    externalId: 496243,
    id: "seed-event-parasite",
    movie: {
      backdropPath: null,
      overview: "Uma família encontra uma oportunidade improvável ao se aproximar da vida de uma família rica em Seul.",
      posterPath: `${tmdbImageBaseUrl}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
      releaseDate: "2019-05-30",
      title: "Parasite",
    },
    priceCents: 3400,
    published: true,
    roomName: "Sala 1",
    rows: 4,
    seatsPerRow: 6,
    soldSeatLabels: ["A4"],
    startHour: 20,
    startsInDays: 4,
    venueName: "Cine Brasília",
  },
  {
    externalId: 372058,
    id: "seed-event-your-name",
    movie: {
      backdropPath: null,
      overview: "Dois jovens desconhecidos descobrem uma ligação capaz de atravessar a distância e o tempo.",
      posterPath: `${tmdbImageBaseUrl}/q719jXXEzOoYaps6babgKnONONX.jpg`,
      releaseDate: "2016-08-26",
      title: "Your Name.",
    },
    priceCents: 3000,
    published: true,
    roomName: "Sala 2",
    rows: 5,
    seatsPerRow: 5,
    soldSeatLabels: [],
    startHour: 16,
    startsInDays: 7,
    venueName: "Cine Projeção",
  },
  {
    externalId: 313369,
    id: "seed-event-la-la-land",
    movie: {
      backdropPath: null,
      overview: "Uma atriz e um pianista se encontram em Los Angeles enquanto tentam sustentar seus sonhos criativos.",
      posterPath: `${tmdbImageBaseUrl}/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg`,
      releaseDate: "2016-12-09",
      title: "La La Land",
    },
    priceCents: 3800,
    published: true,
    roomName: "Sala 3",
    rows: 4,
    seatsPerRow: 7,
    soldSeatLabels: ["D1", "D2"],
    startHour: 21,
    startsInDays: 15,
    venueName: "Cine Brasília",
  },
  {
    externalId: 12477,
    id: "seed-event-grave-of-the-fireflies",
    movie: {
      backdropPath: null,
      overview: "Dois irmãos tentam sobreviver no Japão devastado pela guerra enquanto protegem a própria infância.",
      posterPath: `${tmdbImageBaseUrl}/k9tv1rXZbOhH7eiCk378x61kNQ1.jpg`,
      releaseDate: "1988-04-16",
      title: "Grave of the Fireflies",
    },
    priceCents: 2800,
    published: true,
    roomName: "Sala 1",
    rows: 3,
    seatsPerRow: 6,
    soldSeatLabels: [],
    startHour: 18,
    startsInDays: 22,
    venueName: "Cine Projeção",
  },
  {
    externalId: 13,
    id: "seed-event-forrest-gump",
    movie: {
      backdropPath: null,
      overview: "A trajetória extraordinária de um homem comum atravessa décadas decisivas da história dos Estados Unidos.",
      posterPath: `${tmdbImageBaseUrl}/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg`,
      releaseDate: "1994-07-06",
      title: "Forrest Gump",
    },
    priceCents: 3600,
    published: true,
    roomName: "Sala 2",
    rows: 5,
    seatsPerRow: 6,
    soldSeatLabels: ["B5"],
    startHour: 19,
    startsInDays: 29,
    venueName: "Cine Brasília",
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
      definition.startHour,
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
