-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "googleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,
    "tokenType" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleToken_userId_key" ON "GoogleToken"("userId");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- AddForeignKey
ALTER TABLE "GoogleToken" ADD CONSTRAINT "GoogleToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
