//----------------------------------------------------------------------------------------------------------------------
// Tests for Character Transform Resolver
//----------------------------------------------------------------------------------------------------------------------

import { expect } from 'chai';

import type { Character } from '../../../src/core/src/models/character.ts';
import {
    type CharacterDBSchema,
    fromDB,
    resolveCharacterDetails,
    toDB,
} from '../../../src/server/src/resource-access/transforms/character.ts';

//----------------------------------------------------------------------------------------------------------------------

function buildDolmenwoodDetails() : Record<string, unknown>
{
    return {
        abilities: {
            str: { score: 10, mod: 0 },
        },
        inventory: {
            items: [
                { name: 'Backpack', weight: 2 },
                { name: 'Lantern', weight: 1 },
            ],
            totalWeight: 999,
        },
    };
}

//----------------------------------------------------------------------------------------------------------------------

describe('character transforms', () =>
{
    it('resolves dolmenwood derived encumbrance for flat details shape', () =>
    {
        const resolved = resolveCharacterDetails('dolmenwood', buildDolmenwoodDetails());
        expect(resolved.derivedEncumbrance).to.equal(0);
        expect((resolved.inventory as Record<string, unknown>).totalWeight).to.equal(3);
    });

    it('resolves dolmenwood derived encumbrance for nested details.dolmenwood shape', () =>
    {
        const resolved = resolveCharacterDetails('dolmenwood', {
            dolmenwood: {
                abilities: {
                    str: { score: 2, mod: -4 },
                },
                inventory: {
                    items: [
                        { name: 'Chain', weight: 3 },
                        { name: 'Shield', weight: 4 },
                    ],
                    totalWeight: 0,
                },
            },
        });

        const nested = resolved.dolmenwood as Record<string, unknown>;
        expect(nested.derivedEncumbrance).to.equal(5);
        expect((nested.inventory as Record<string, unknown>).totalWeight).to.equal(7);
    });

    it('toDB stores resolved derived encumbrance', () =>
    {
        const character : Character = {
            id: 'char-test-1',
            system: 'dolmenwood',
            name: 'Test Character',
            accountID: 'acct-1',
            noteID: 'note-1',
            details: buildDolmenwoodDetails(),
            created: Date.now(),
            updated: Date.now(),
        };

        const dbRecord = toDB(character);
        const parsed = JSON.parse(dbRecord.details ?? '{}') as Record<string, unknown>;

        expect(parsed.derivedEncumbrance).to.equal(0);
        expect((parsed.inventory as Record<string, unknown>).totalWeight).to.equal(3);
    });

    it('fromDB returns details with derived encumbrance resolved', () =>
    {
        const details = buildDolmenwoodDetails();
        const characterIDKey = 'character_id';
        const noteIDKey = 'note_id';
        const accountIDKey = 'account_id';

        const dbRow : CharacterDBSchema = {
            [characterIDKey]: 'char-test-2',
            system: 'dolmenwood',
            name: 'DB Character',
            description: '',
            portrait: '',
            thumbnail: '',
            color: '#123456',
            campaign: '',
            details: JSON.stringify(details),
            [noteIDKey]: 'note-2',
            [accountIDKey]: 'acct-2',
            created: new Date('2026-01-01T00:00:00.000Z').toISOString(),
            updated: new Date('2026-01-01T00:00:00.000Z').toISOString(),
        };

        const transformed = fromDB(dbRow);
        const resolved = transformed.details as Record<string, unknown>;

        expect(resolved.derivedEncumbrance).to.equal(0);
        expect((resolved.inventory as Record<string, unknown>).totalWeight).to.equal(3);
    });
});

//----------------------------------------------------------------------------------------------------------------------
