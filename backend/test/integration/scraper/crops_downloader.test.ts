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

vi.mock("../../../src/scraper/prisma", () => ({
    prisma: {
        crop: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
    },
}));

const mockedAxios = axios as any;
const mockedFs = fs as any;

// --------------------------------------------------
// tests
// --------------------------------------------------
describe("download_crops", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.FILE_LOCATION = "./tmp";
    });

    it("downloads crops and stores file_location", async () => {
        const crops = [
            { id: 1, url: "https://img/1.jpg", name: "FE3_header" },
            { id: 2, url: "https://img/2.jpg", name: "FE3_grid" },
        ];

        prisma.crop.findMany
            .mockResolvedValueOnce(crops);   // filtered crops

        mockedAxios.mockResolvedValue({
            data: Buffer.from("file"),
        });

        await download_crops();

        expect(mockedAxios).toHaveBeenCalledTimes(2);

        expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);

        expect(prisma.crop.update).toHaveBeenCalledTimes(2);

        expect(prisma.crop.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 1 },
                data: expect.objectContaining({
                    file_location: expect.stringContaining("/tmp"),
                }),
            })
        );
    });

    it("handles failed downloads without crashing", async () => {
        const crops = [
            { id: 1, url: "https://bad-url", name: "FE3_header" },
        ];

        prisma.crop.findMany
            .mockResolvedValueOnce(crops);

        mockedAxios.mockRejectedValue(new Error("fail"));

        await download_crops();

        expect(prisma.crop.update).not.toHaveBeenCalled();
    });

    it("handles empty crop list", async () => {
        prisma.crop.findMany
            .mockResolvedValueOnce([]);

        await download_crops();

        expect(mockedAxios).not.toHaveBeenCalled();
        expect(prisma.crop.update).not.toHaveBeenCalled();
    });

    it("processes crops in chunks", async () => {
        const crops = Array.from({ length: 25 }).map((_, i) => ({
            id: i + 1,
            url: `https://img/${i}.jpg`,
            name: "FE3_header",
        }));

        prisma.crop.findMany
            .mockResolvedValueOnce(crops);

        mockedAxios.mockResolvedValue({
            data: Buffer.from("file"),
        });

        await download_crops();

        expect(mockedAxios).toHaveBeenCalledTimes(25);
        expect(prisma.crop.update).toHaveBeenCalledTimes(25);
    });

    it("does not attempt download when url is null", async () => {
        const crops = [
            { id: 1, url: null, name: "FE3_header" },
        ];

        prisma.crop.findMany
            .mockResolvedValueOnce(crops);

        await download_crops();

        expect(mockedAxios).not.toHaveBeenCalled();
    });

    it("does not attempt download when name isnt FE3_header or FE3_grid is null", async () => {
        const crops = [
            { id: 1, url: "https://idk", name: "FE3_cropped" },
        ];

        prisma.crop.findMany
            .mockResolvedValueOnce(crops);

        await download_crops();

        expect(mockedAxios).not.toHaveBeenCalled();
    });


});