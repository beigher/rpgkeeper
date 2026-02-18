//----------------------------------------------------------------------------------------------------------------------
// Dolmenwood - Schema
//----------------------------------------------------------------------------------------------------------------------

import { z } from 'zod';
import type { DolmenwoodSystemDetails } from './models.ts';

//----------------------------------------------------------------------------------------------------------------------

const abilityBlockSchema = z.object({
    score: z.number().int()
        .min(0)
        .max(30),
    mod: z.number().int()
        .min(-10)
        .max(20),
});

const abilitiesSchema = z.object({
    str: abilityBlockSchema,
    int: abilityBlockSchema,
    wis: abilityBlockSchema,
    dex: abilityBlockSchema,
    con: abilityBlockSchema,
    cha: abilityBlockSchema,
});

const savesSchema = z.object({
    doom: z.number().int(),
    hold: z.number().int(),
    spell: z.number().int(),
    magic: z.number().int(),
    ray: z.number().int(),
    blast: z.number().int(),
    resistance: z.number().int(),
});

const movementSchema = z.object({
    speedRoundFt: z.number().int()
        .min(0),
    exploringTurnFt: z.number().int()
        .min(0),
    overlandPtsDay: z.number().int()
        .min(0),
});

const skillsSchema = z.object({
    listen: z.number().int(),
    search: z.number().int(),
    survival: z.number().int(),
    modifier: z.number().int(),
});

const identitySchema = z.object({
    kindredClass: z.string().max(255),
    background: z.string().max(255),
    alignment: z.string().max(255),
    affiliation: z.string().max(255),
    moonSign: z.string().max(255),
});

const advancementSchema = z.object({
    xp: z.number().int()
        .min(0),
    level: z.number().int()
        .min(0),
    nextLevel: z.number().int()
        .min(0),
});

const coinsSchema = z.object({
    cp: z.number().int()
        .min(0),
    sp: z.number().int()
        .min(0),
    gp: z.number().int()
        .min(0),
    pell: z.number().int()
        .min(0),
});

const inventoryItemSchema = z.object({
    name: z.string(),
    weight: z.number()
        .min(0),
});

const inventorySchema = z.object({
    encumbranceMethod: z.enum([ 'weight', 'slots' ]),
    tinyItems: z.string(),
    equippedItems: z.string(),
    stowedItems: z.string(),
    items: z.array(inventoryItemSchema),
    totalWeight: z.number().min(0),
    coins: coinsSchema,
    otherNotes: z.string(),
});

export const dolmenwoodDetailsSchema = z.object({
    identity: identitySchema,
    abilities: abilitiesSchema,

    hpCurrent: z.number().int()
        .min(0),
    hpMax: z.number().int()
        .min(0),

    ac: z.number().int(),
    attack: z.number().int(),

    saves: savesSchema,
    movement: movementSchema,
    skills: skillsSchema,

    advancement: advancementSchema,

    languages: z.string(),
    classTraits: z.string(),

    inventory: inventorySchema,

    derivedEncumbrance: z.number()
        .min(0),
}) satisfies z.ZodType<DolmenwoodSystemDetails>;

//----------------------------------------------------------------------------------------------------------------------

export default dolmenwoodDetailsSchema;

//----------------------------------------------------------------------------------------------------------------------
