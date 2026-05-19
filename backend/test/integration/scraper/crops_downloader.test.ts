    import { describe, it, expect, vi, beforeEach } from "vitest";
    import * as fs from "node:fs";
    import axios from "axios";

    import { prisma } from "../../../src/scraper/prisma";
    import { download_crops } from "../../../src/scraper/crops_downloader";

    // --------------------------------------------------
    // mocks
    // --------------------------------------------------
    vi.mock("axios");
    vi.mock("node:fs", () => ({
        writeFileSync: vi.fn(),
    }));

    const mockedAxios = axios as any;
    const mockedFs = fs as any;

    // --------------------------------------------------
    // tests
    // --------------------------------------------------
    describe("download_crops", () => {
        beforeAll(async () => {
            await prisma.$connect();
        });
        beforeEach(async () => {
            vi.clearAllMocks();
            process.env.CROP_LOCATION = "/crops/";

            // Clean up database before each test
            await prisma.crop.deleteMany();
        });

        afterAll(async () => {
            await prisma.$disconnect();
        });

        it("downloads crops", async () => {
            const crops = [
                {url: "https://img/1.jpg", name: "FE3_header"},
                {url: "https://img/2.jpg", name: "FE3_boxed"},
            ];
            const prisma_crops = await prisma.$transaction(
                crops.map(crop => prisma.crop.create({data: crop}))
            );

            mockedAxios.mockResolvedValue({
                data: Buffer.from("file"),
            });

            await download_crops(prisma_crops);

            expect(mockedAxios).toHaveBeenCalledTimes(2);

            expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);

            const foundCrops = await prisma.crop.findMany();

            expect(foundCrops.length).toBe(2);
        });

        it("handles failed downloads without crashing", async () => {
            const crops = [
                {url: "https://bad-url", name: "FE3_header"},
            ];
            const prisma_crops = await prisma.$transaction(
                crops.map(crop => prisma.crop.create({data: crop}))
            );


            mockedAxios.mockRejectedValue(new Error("fail"));

            await download_crops(prisma_crops);

            const foundCrops = await prisma.crop.findMany();

            // the crop should be deleted from prisma.
            expect(foundCrops.length).toBe(0);
        });

        it("handles empty crop list", async () => {


            await download_crops([]);

            expect(mockedAxios).not.toHaveBeenCalled();
            const foundCrops = await prisma.crop.findMany();

            expect(foundCrops.length).toBe(0);
        });

        it("processes crops in chunks", async () => {
            const crops = Array.from({length: 25}).map((_, i) => ({
                url: `https://img/${i}.jpg`,
                name: "FE3_header",
            }));
            const prisma_crops = await prisma.$transaction(
                crops.map(crop => prisma.crop.create({data: crop}))
            );

            mockedAxios.mockResolvedValue({
                data: Buffer.from("file"),
            });

            await download_crops(prisma_crops);

            expect(mockedAxios).toHaveBeenCalledTimes(25);
            const foundCrops = await prisma.crop.findMany();


            expect(foundCrops.length).toBe(25);
        });
    });