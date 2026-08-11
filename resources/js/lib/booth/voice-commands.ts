import type { NavigationAction } from '@/lib/booth/navigation';

/**
 * Phrase matching for the spoken navigation commands.
 *
 * A booth is a noisy room and "next" is a single short syllable, which is the
 * hardest thing for a speech engine to get right. Chrome regularly returns
 * "text", "nest" or "necks" for a perfectly clear "next". Matching only the
 * exact word is why a customer ends up repeating themselves.
 *
 * Three layers of tolerance, in order of confidence:
 *
 *  1. the intended words,
 *  2. a curated list of what engines actually return instead, and
 *  3. an edit-distance fallback for anything one keystroke away.
 *
 * Both languages are always accepted regardless of the configured recognition
 * language: Indonesian operators routinely say "next".
 */

type CommandVocabulary = {
    action: NavigationAction;
    /** Words treated as the command, including known mis-transcriptions. */
    words: string[];
    /** Words that fuzzy matching may approximate. Kept short and distinctive. */
    fuzzy: string[];
};

const VOCABULARY: CommandVocabulary[] = [
    {
        action: 'PREVIOUS_POSE',
        words: [
            'previous',
            'previous pose',
            'prev',
            'back',
            'go back',
            'before',
            'sebelumnya',
            'sebelum',
            'kembali',
            'balik',
            'mundur',
            'sebelumny',
        ],
        fuzzy: ['previous', 'kembali', 'sebelumnya', 'mundur'],
    },
    {
        action: 'NEXT_POSE',
        words: [
            'next',
            'next pose',
            'next please',
            'forward',
            'go next',
            // What engines actually hear instead of "next".
            //
            // "neck" and "net" were here too and are now deliberately gone:
            // both are everyday words, and neither is a common enough
            // mis-hearing to be worth moving the session on by accident.
            'text',
            'nest',
            'necks',
            'nex',
            'mext',
            'lanjut',
            'lanjutkan',
            'selanjutnya',
            'berikutnya',
            'ganti',
        ],
        // "ganti" and "terus" are deliberately absent: "nanti" and "harus" are
        // everyday words that sound one letter away and would move the session
        // in the middle of an ordinary sentence.
        fuzzy: ['next', 'lanjut', 'selanjutnya', 'berikutnya'],
    },
];

/** Tokens shorter than this are too easy to confuse to fuzzy match. */
const MINIMUM_FUZZY_LENGTH = 3;

/**
 * Reduce a word to how it sounds, so spelling differences stop mattering.
 *
 * Curating a list of what an engine returns instead of "next" only ever covers
 * the mistakes somebody happened to notice. Comparing sound generalises it:
 * "next", "necks" and "nexs" collapse to nearly the same key, and anything else
 * that sounds like it does too, including the mis-hearings nobody listed.
 */
function phoneticKey(word: string): string {
    return word
        .toLowerCase()
        .replace(/[^a-z]/g, '')
        .replace(/ph/g, 'f')
        .replace(/x/g, 'ks')
        .replace(/ck/g, 'k')
        .replace(/[cq]/g, 'k')
        .replace(/z/g, 's')
        .replace(/(.)\1+/g, '$1');
}

/**
 * Longer words carry enough information to survive two wrong letters; short
 * ones do not, and loosening them turns ordinary speech into commands.
 */
function distanceLimitFor(key: string): number {
    return key.length >= 7 ? 2 : 1;
}

/**
 * A matched command, and how sure we are.
 *
 * `exact` means the engine returned a word we recognise outright. Those are
 * acted on unconditionally. A fuzzy match is a guess, so the caller may weigh
 * it against the engine's own confidence.
 */
export type VoiceMatch = {
    action: NavigationAction;
    exact: boolean;
};

/**
 * Levenshtein distance, capped: the moment it exceeds `limit` it stops.
 *
 * Only used on single words, so the simple matrix is fast enough.
 */
function isWithinDistance(a: string, b: string, limit: number): boolean {
    if (Math.abs(a.length - b.length) > limit) {
        return false;
    }

    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        let best = i;

        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;

            current[j] = Math.min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + cost,
            );

            best = Math.min(best, current[j]);
        }

        // Nothing further down this row can come back under the limit.
        if (best > limit) {
            return false;
        }

        previous = current;
    }

    return previous[b.length] <= limit;
}

/**
 * Break a transcript into comparable lowercase words.
 */
function tokenize(transcript: string): string[] {
    return transcript
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

/**
 * Resolve a transcript into a navigation action.
 *
 * Only the tail of the transcript is inspected. Chrome grows its interim
 * transcript as the customer keeps talking, so matching the whole string would
 * keep re-firing on a command that was already handled.
 */
export function matchVoiceCommand(
    transcript: string,
    tailWords = 6,
): VoiceMatch | null {
    const words = tokenize(transcript);

    if (words.length === 0) {
        return null;
    }

    const tail = words.slice(-tailWords);
    const phrase = tail.join(' ');

    // Exact words and phrases first: no guessing when the engine got it right.
    for (const entry of VOCABULARY) {
        for (const candidate of entry.words) {
            if (candidate.includes(' ')) {
                if (phrase.includes(candidate)) {
                    return { action: entry.action, exact: true };
                }

                continue;
            }

            if (tail.includes(candidate)) {
                return { action: entry.action, exact: true };
            }
        }
    }

    // Then anything a single keystroke away from a distinctive command word.
    for (const entry of VOCABULARY) {
        for (const word of tail) {
            if (word.length < MINIMUM_FUZZY_LENGTH) {
                continue;
            }

            if (
                entry.fuzzy.some((candidate) =>
                    isWithinDistance(word, candidate, 1),
                )
            ) {
                return { action: entry.action, exact: false };
            }
        }
    }

    return null;
}

/**
 * Resolve the best action across every alternative the engine offered.
 *
 * Chrome ranks alternatives by its own confidence, which for a single syllable
 * is close to a coin toss: the intended "next" is often the second or third
 * guess. Scanning them all is the single biggest win in recognition rate, and
 * costs nothing because the alternatives are already in the event.
 */
export function matchVoiceAlternatives(
    transcripts: string[],
): VoiceMatch | null {
    let fallback: VoiceMatch | null = null;

    for (const transcript of transcripts) {
        const match = matchVoiceCommand(transcript);

        if (match === null) {
            continue;
        }

        // An exact hit anywhere in the list beats a fuzzy guess in a
        // higher ranked alternative.
        if (match.exact) {
            return match;
        }

        fallback ??= match;
    }

    return fallback;
}

/**
 * Test one word against a command vocabulary, exactly then fuzzily.
 */
function wordMatches(
    word: string,
    entry: CommandVocabulary,
    allowFuzzy: boolean,
): boolean {
    if (entry.words.includes(word)) {
        return true;
    }

    if (!allowFuzzy || word.length < MINIMUM_FUZZY_LENGTH) {
        return false;
    }

    const spoken = phoneticKey(word);

    return entry.fuzzy.some((candidate) => {
        const target = phoneticKey(candidate);

        return isWithinDistance(spoken, target, distanceLimitFor(target));
    });
}

/**
 * List every command in a transcript, in the order they were spoken.
 *
 * A continuous recognition session hands back one transcript that keeps growing
 * as the customer talks: "next", then "next next", then "next next next". Asking
 * "does this contain a command?" answers yes every time and cannot tell a fresh
 * "next" from the one already handled — which is why saying it three times in a
 * row moved the session once, if at all.
 *
 * Returning the full sequence lets the caller act on the *new* commands only,
 * so every repeat lands and nothing is replayed.
 */
export function extractCommands(
    transcript: string,
    allowFuzzy = true,
): NavigationAction[] {
    const words = tokenize(transcript);
    const commands: NavigationAction[] = [];

    for (let index = 0; index < words.length; index++) {
        // Two word phrases first: "go back" must not register as "back" alone.
        const pair = `${words[index]} ${words[index + 1] ?? ''}`.trim();
        const phraseEntry = VOCABULARY.find((entry) =>
            entry.words.includes(pair),
        );

        if (phraseEntry) {
            commands.push(phraseEntry.action);
            index++;

            continue;
        }

        const entry = VOCABULARY.find((candidate) =>
            wordMatches(words[index], candidate, allowFuzzy),
        );

        if (entry) {
            commands.push(entry.action);
        }
    }

    return commands;
}

/**
 * Take the commands from the highest ranked alternative that heard any.
 *
 * The alternatives are competing transcriptions of the *same* audio, so they
 * routinely disagree on how many times a word was said: one "next" often comes
 * back as "next" at the top and "next next" further down. Picking whichever
 * heard the most therefore over-counts systematically, which is what made a
 * single "next" jump two poses.
 *
 * The engine's own top guess decides how many. The lower ranked ones are only
 * consulted when it heard no command at all, which is the case they exist for.
 */
export function extractCommandsFromAlternatives(
    transcripts: string[],
    allowFuzzy = true,
): NavigationAction[] {
    for (const transcript of transcripts) {
        const commands = extractCommands(transcript, allowFuzzy);

        if (commands.length > 0) {
            return commands;
        }
    }

    return [];
}

/**
 * The phrases to put in front of the customer for a recognition language.
 *
 * The hint has to match what the engine is actually transcribing. Telling
 * somebody to say "lanjut" while recognition runs in English asks them to lose:
 * the engine is listening for English words and will return something else.
 */
export function voiceExamples(language: string): {
    next: string;
    previous: string;
} {
    return language.startsWith('id')
        ? { next: 'lanjut', previous: 'kembali' }
        : { next: 'next', previous: 'previous' };
}
