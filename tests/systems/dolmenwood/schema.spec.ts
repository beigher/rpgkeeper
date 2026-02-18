//----------------------------------------------------------------------------------------------------------------------
// Tests for Dolmenwood System Schema
//----------------------------------------------------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect } from 'chai';

import dolmenwoodDetailsSchema from '../../../src/systems/src/dolmenwood/schema.ts';

//----------------------------------------------------------------------------------------------------------------------

const validDetails = {
    identity: {
        kindredClass: 'Moss Dwarf Friar',
        background: 'Forager',
        alignment: 'Neutral',
        affiliation: 'Abbey',
        moonSign: 'Hare',
    },
    abilities: {
        str: { score: 12, mod: 1 },
        int: { score: 10, mod: 0 },
        wis: { score: 13, mod: 1 },
        dex: { score: 9, mod: -1 },
        con: { score: 11, mod: 0 },
        cha: { score: 8, mod: -1 },
    },
    hpCurrent: 7,
    hpMax: 9,
    ac: 14,
    attack: 2,
    saves: {
        doom: 11,
        hold: 9,
        spell: 10,
        magic: 10,
        ray: 12,
        blast: 13,
        resistance: 9,
    },
    movement: {
        speedRoundFt: 30,
        exploringTurnFt: 90,
        overlandPtsDay: 24,
    },
    skills: {
        listen: 2,
        search: 1,
        survival: 3,
        modifier: 0,
    },
    advancement: {
        xp: 1200,
        level: 2,
        nextLevel: 2000,
    },
    languages: 'Common\nWoldish',
    classTraits: 'Night vision',
    inventory: {
        encumbranceMethod: 'weight',
        tinyItems: 'chalk, twine',
        equippedItems: 'club',
        stowedItems: 'rations',
        items: [
            { name: 'Backpack', weight: 2 },
            { name: 'Rope', weight: 1.5 },
        ],
        totalWeight: 3.5,
        coins: {
            cp: 4,
            sp: 8,
            gp: 2,
            pell: 0,
        },
        otherNotes: '',
    },
    derivedEncumbrance: 0,
};

//----------------------------------------------------------------------------------------------------------------------

describe('dolmenwoodDetailsSchema', () =>
{
    it('accepts valid character details', () =>
    {
        const result = dolmenwoodDetailsSchema.safeParse(validDetails);
        expect(result.success).to.be.true;
    });

    it('rejects negative item weight', () =>
    {
        const result = dolmenwoodDetailsSchema.safeParse({
            ...validDetails,
            inventory: {
                ...validDetails.inventory,
                items: [
                    { name: 'Backpack', weight: -1 },
                ],
            },
        });

        expect(result.success).to.be.false;
    });

    it('rejects negative derived encumbrance', () =>
    {
        const result = dolmenwoodDetailsSchema.safeParse({
            ...validDetails,
            derivedEncumbrance: -1,
        });

        expect(result.success).to.be.false;
    });
});

//----------------------------------------------------------------------------------------------------------------------
