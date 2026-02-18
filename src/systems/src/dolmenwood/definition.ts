//----------------------------------------------------------------------------------------------------------------------
// Dolmenwood System Definition
//----------------------------------------------------------------------------------------------------------------------

import { SupportStatus, type SystemDefinition } from '@rpgk/core/models/system';
import type { DolmenwoodSystemDetails } from './models.ts';
import dolmenwoodDetailsSchema from './schema.ts';

//----------------------------------------------------------------------------------------------------------------------

const dolmenwoodDefinition : SystemDefinition<DolmenwoodSystemDetails>
    & { detailsSchema : typeof dolmenwoodDetailsSchema } = {
        detailsSchema: dolmenwoodDetailsSchema,
        id: 'dolmenwood',
        name: 'Dolmenwood',
        description: 'Old-school fantasy characters for Dolmenwood (Necrotic Gnome).',
        status: SupportStatus.Beta,

        // IMPORTANT: defaults must match schema so details always exist
        defaults: {
            identity: {
                kindredClass: '',
                background: '',
                alignment: '',
                affiliation: '',
                moonSign: '',
            },

            abilities: {
                str: { score: 0, mod: 0 },
                int: { score: 0, mod: 0 },
                wis: { score: 0, mod: 0 },
                dex: { score: 0, mod: 0 },
                con: { score: 0, mod: 0 },
                cha: { score: 0, mod: 0 },
            },

            hpCurrent: 0,
            hpMax: 0,

            ac: 0,
            attack: 0,

            saves: {
                doom: 0,
                hold: 0,
                spell: 0,
                magic: 0,
                ray: 0,
                blast: 0,
                resistance: 0,
            },

            movement: {
                speedRoundFt: 0,
                exploringTurnFt: 0,
                overlandPtsDay: 0,
            },

            skills: {
                listen: 0,
                search: 0,
                survival: 0,
                modifier: 0,
            },

            advancement: {
                xp: 0,
                level: 1,
                nextLevel: 0,
            },

            languages: '',
            classTraits: '',

            inventory: {
                encumbranceMethod: 'weight',
                tinyItems: '',
                equippedItems: '',
                stowedItems: '',
                items: [],
                totalWeight: 0,
                coins: { cp: 0, sp: 0, gp: 0, pell: 0 },
                otherNotes: '',
            },

            derivedEncumbrance: 0,
        },
    };

export default dolmenwoodDefinition;
export { dolmenwoodDefinition };

//----------------------------------------------------------------------------------------------------------------------
