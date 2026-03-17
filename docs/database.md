# Databank
## Configuratie
Het is belangrijk dat je een volume en netwerk aanmaakt voor je docker container.
Momentel maken we gebruik van de `default` instellingen. Indien je je eigen netwerk of volume wil aanmaken kan je de volgende
commando's runnen met daar bovenop eigen opties die `docker` je aanbied:
```bash
docker volume create vnv_data
```
```
docker network create vnv_net
```

Een aantal variabelen zijn ook nodig om de databank op te starten. Zorg ervoor dat de volgende variabelen in je `.env` bestand ingesteld zijn.
### postgres
`POSTGRES_USER`: naam van de postgres gebruiker

`POSTGRES_PASSWORD`: wachtwoord voor je postgres gebruiker

`POSTGRES_DB`: naam van de databank
### prisma
`DATABASE_URL`: URL naar je postgres databank

Dit zou het volgend formaat moeten hebben:

`postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${database}:${port}/${DATABASE_DB}`

met
 
`database`: de naam van je docker service beschreven in het `docker-compose-db.yml` bestand.

`port`: het poort van je postgres databank, standaard is dit `5432`

## Opstarten
### postgres
```bash
docker compose -f docker-compose-db.yml up
```
### prisma
```bash
# Create and apply a new migration
npx prisma migrate dev --name describe-your-change

# Regenerate the Prisma client (usually automatic after migrate dev)
npx prisma generate
```
