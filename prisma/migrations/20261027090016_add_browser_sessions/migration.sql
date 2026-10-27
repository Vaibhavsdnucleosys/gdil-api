-- CreateTable
CREATE TABLE `browser_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `browserId` VARCHAR(64) NOT NULL,
    `sessionKey` VARCHAR(36) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `browser_sessions_sessionKey_key`(`sessionKey`),
    INDEX `browser_sessions_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `browser_sessions_userId_browserId_key`(`userId`, `browserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `browser_sessions` ADD CONSTRAINT `browser_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `admin_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
