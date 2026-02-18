//----------------------------------------------------------------------------------------------------------------------
// Character Database Transform
//----------------------------------------------------------------------------------------------------------------------

// Models
import type { Character } from '@rpgk/core';
import { type DolmenwoodInventoryItem, computeDerivedEncumbrance, sumItemWeights } from '@rpgk/systems';

// Utils
import { fromDBTimestamp } from './utils/timestamp.ts';
import { fromJSON, toJSON } from './utils/json.ts';

//----------------------------------------------------------------------------------------------------------------------

export interface CharacterDBSchema extends Omit<
    Character, 'id' | 'details' | 'accountID' | 'noteID' | 'created' | 'updated'
>
{
    character_id : string;
    details : string | null;
    note_id : string;
    account_id : string;
    created : string;
    updated : string;
}

//----------------------------------------------------------------------------------------------------------------------

function isRecord(value : unknown) : value is Record<string, unknown>
{
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value : unknown) : number
{
    if(typeof value === 'number' && Number.isFinite(value))
    {
        return value;
    }
    if(typeof value === 'string')
    {
        const parsed = Number(value);
        if(Number.isFinite(parsed))
        {
            return parsed;
        }
    }
    return 0;
}

function normalizeItems(value : unknown) : DolmenwoodInventoryItem[]
{
    if(!Array.isArray(value))
    {
        return [];
    }

    const output : DolmenwoodInventoryItem[] = [];
    for(const raw of value)
    {
        if(isRecord(raw))
        {
            output.push({
                name: typeof raw.name === 'string' ? raw.name : '',
                weight: Math.max(0, toNumber(raw.weight)),
            });
        }
    }

    return output;
}

function resolveDolmenwoodDetails(details : Record<string, unknown>) : Record<string, unknown>
{
    const resolved = { ...details };
    const abilities = isRecord(resolved.abilities) ? resolved.abilities : {};
    const strength = isRecord(abilities.str) ? toNumber(abilities.str.score) : 0;

    const inventory = isRecord(resolved.inventory) ? { ...resolved.inventory } : {};
    const items = normalizeItems(inventory.items);
    const totalWeight = items.length > 0 ? sumItemWeights(items) : Math.max(0, toNumber(inventory.totalWeight));

    inventory.items = items;
    inventory.totalWeight = totalWeight;

    resolved.inventory = inventory;
    resolved.derivedEncumbrance = computeDerivedEncumbrance(totalWeight, strength);

    return resolved;
}

export function resolveCharacterDetails(system : string, details : unknown) : Record<string, unknown>
{
    const resolved = isRecord(details) ? { ...details } : {};
    if(system !== 'dolmenwood')
    {
        return resolved;
    }

    if(isRecord(resolved.dolmenwood))
    {
        resolved.dolmenwood = resolveDolmenwoodDetails(resolved.dolmenwood);
        return resolved;
    }

    return resolveDolmenwoodDetails(resolved);
}

//----------------------------------------------------------------------------------------------------------------------

export function toDB(character : Character) : Omit<CharacterDBSchema, 'created' | 'updated'>
{
    const { id, details, accountID, noteID, created, updated, ...rest } = character;

    if(!id)
    {
        throw new Error('Cannot convert character to DB format: character has no ID');
    }

    return {
        ...rest,
        character_id: id,
        details: toJSON(resolveCharacterDetails(character.system, details)),
        note_id: noteID,
        account_id: accountID,
    };
}

export function fromDB(character : CharacterDBSchema) : Character
{
    const { character_id, details, note_id, account_id, created, updated, ...rest } = character;
    const parsedDetails = resolveCharacterDetails(rest.system, fromJSON(details ?? '{}') ?? {});

    return {
        id: character_id,
        name: rest.name,
        system: rest.system,
        description: rest.description,
        portrait: rest.portrait,
        thumbnail: rest.thumbnail,
        color: rest.color,
        campaign: rest.campaign,
        details: parsedDetails,
        noteID: note_id,
        accountID: account_id,
        created: fromDBTimestamp(created),
        updated: fromDBTimestamp(updated),
    };
}

//----------------------------------------------------------------------------------------------------------------------
