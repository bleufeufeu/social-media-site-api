-- CreateTable
CREATE TABLE "_UserFollowingFollowers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserFollowingFollowers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserFollowingFollowers_B_index" ON "_UserFollowingFollowers"("B");

-- AddForeignKey
ALTER TABLE "_UserFollowingFollowers" ADD CONSTRAINT "_UserFollowingFollowers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFollowingFollowers" ADD CONSTRAINT "_UserFollowingFollowers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
