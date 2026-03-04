import { ArchiveService } from './archive.service.js'

/**
 * Archive Controller
 *
 * Controllers extract data from HTTP requests, call services,
 * and format HTTP responses. No business logic, no database access.
 */
export class ArchiveController {
    constructor(private readonly service: ArchiveService) { }

    // TODO: implement real handler methods, e.g.:
    // async getProductions(request: FastifyRequest, reply: FastifyReply) { ... }
    // async getProductionById(request: FastifyRequest, reply: FastifyReply) { ... }
}
