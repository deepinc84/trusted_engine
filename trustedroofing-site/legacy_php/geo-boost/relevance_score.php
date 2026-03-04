<?php
/**
 * relevance_score.php
 *
 * Provides a single function:
 *   compute_relevance_score(string $keyword, string $postText): int (0–100)
 *
 * It uses:
 *  - exact keyword phrase matches
 *  - keyword word matches
 *  - LSI (related) terms per keyword
 *  - early placement bonus
 *  - spam penalty if keyword density is too high
 */

////////////////////////////
// CONFIG: LSI term map
////////////////////////////

function geo_lsi_map(): array {
    // Lowercase keys. You can expand this as much as you want.
    return [
        'roof repair' => [
            'roof', 'repair', 'repairs',
            'leak', 'leaks', 'leaking',
            'shingle', 'shingles',
            'decking', 'sheathing',
            'flashing', 'underlayment',
            'vent', 'vents', 'ridge', 'hip',
            'hail', 'wind', 'storm', 'ice dam'
        ],
        'roof replacement' => [
            'tear off', 'reroof', 're roof', 're-roof',
            'new roof', 'installation',
            'asphalt', 'architectural', 'laminate',
            'ridge cap', 'ice shield'
        ],
        'hail damage' => [
            'hail', 'hailstones', 'storm',
            'impact', 'bruising',
            'insurance', 'claim', 'adjuster'
        ],
        'emergency roofer' => [
            'emergency', '24 7', '24-7', 'after hours',
            'tarp', 'temporary', 'leak', 'urgent'
        ],
        'hardie siding' => [
            'hardie', 'james hardie',
            'fiber cement', 'fibercement',
            'lap siding', 'panel', 'board', 'batten',
            'trim', 'soffit', 'fascia',
            'colourplus', 'colorplus'
        ],
        'eavestrough' => [
            'eavestrough', 'eaves', 'gutters',
            'downpipe', 'downspout',
            'drainage', 'runoff'
        ],
        'roof inspection' => [
            'inspection', 'inspections', 'inspect',
            'report', 'assessment',
            'maintenance', 'preventative', 'preventive',
            'estimate', 'quote'
        ],
        // Fallback key used if there is no more specific match
        '__generic__' => [
            'roof', 'roofing', 'shingle', 'shingles',
            'siding', 'eavestrough', 'gutters', 'downspout',
            'leak', 'flashing', 'vent', 'soffit', 'fascia',
            'hail', 'storm', 'wind', 'snow', 'ice'
        ],
    ];
}

////////////////////////////
// Helpers
////////////////////////////

function geo_tokenize(string $text): array {
    $text = strtolower($text);
    // Replace anything not letter or digit with spaces
    $text = preg_replace('/[^a-z0-9]+/i', ' ', $text);
    $text = trim($text);
    if ($text === '') {
        return [];
    }
    return preg_split('/\s+/', $text);
}

function geo_pick_lsi_list(string $keyword): array {
    $map = geo_lsi_map();
    $k   = strtolower(trim($keyword));

    // Exact match first
    if (isset($map[$k])) {
        return $map[$k];
    }

    // Try to find a key that is contained in the keyword
    foreach ($map as $key => $list) {
        if ($key === '__generic__') continue;
        if (strpos($k, $key) !== false) {
            return $list;
        }
    }

    // Fallback generic list
    return $map['__generic__'] ?? [];
}

////////////////////////////
// Main scorer
////////////////////////////

function compute_relevance_score(string $keyword, string $postText): int
{
    $kwPhrase   = strtolower(trim($keyword));
    $postLower  = strtolower($postText);

    // Guard clause
    $tokens     = geo_tokenize($postText);
    $wordCount  = max(count($tokens), 1);

    // 1. Exact phrase matches
    $phraseCount = ($kwPhrase !== '')
        ? substr_count($postLower, $kwPhrase)
        : 0;

    // 2. Keyword word matches and density
    $kwWords      = geo_tokenize($keyword);
    $kwWordSet    = array_flip($kwWords);
    $kwWordHits   = 0;

    foreach ($tokens as $w) {
        if (isset($kwWordSet[$w])) {
            $kwWordHits++;
        }
    }

    $kwDensity = $kwWordHits / $wordCount; // between 0 and 1

    // 3. LSI matches
    $lsiList    = geo_pick_lsi_list($keyword);
    $lsiTokens  = [];
    foreach ($lsiList as $lsi) {
        $lsiTokens = array_merge($lsiTokens, geo_tokenize($lsi));
    }
    $lsiTokens   = array_unique($lsiTokens);
    $lsiSet      = array_flip($lsiTokens);
    $lsiHits     = 0;
    $lsiHitWords = [];

    foreach ($tokens as $w) {
        if (isset($lsiSet[$w])) {
            $lsiHits++;
            $lsiHitWords[$w] = true;
        }
    }

    $uniqueLsiHits = count($lsiHitWords);
    $totalLsi      = max(count($lsiTokens), 1);

    // 4. Position bonus: keyword appears early
    $firstChunk = implode(' ', array_slice($tokens, 0, 40));
    $firstChunkStr = strtolower($firstChunk);
    $posBonus = 0;
    if ($kwPhrase !== '' && strpos($firstChunkStr, $kwPhrase) !== false) {
        $posBonus += 8;
    } else {
        // partial word bonus if any keyword word appears early
        foreach ($kwWords as $w) {
            if (strpos($firstChunkStr, $w) !== false) {
                $posBonus += 4;
                break;
            }
        }
    }

    ////////////////////////////
    // Component scores
    ////////////////////////////

    // Phrase score: up to 35
    $phraseScore = min(35, $phraseCount * 20); // 1 exact = 20, 2+ hits cap

    // Keyword density score: up to 30
    // Treat 1–3 percent as healthy; more than ~5 percent starts to look spammy.
    $kwPercent = $kwDensity * 100.0;
    if ($kwPercent <= 0.3) {
        $kwFreqScore = 0;
    } elseif ($kwPercent <= 3.0) {
        // ramp up from 0 to 30
        $kwFreqScore = 30 * (($kwPercent - 0.3) / (3.0 - 0.3));
    } else {
        // above 3 percent does not give extra positive score
        $kwFreqScore = 30;
    }

    // LSI score: up to 25 based on unique LSI hits
    $lsiCoverage  = $uniqueLsiHits / $totalLsi;
    $lsiScore     = min(25, $lsiCoverage * 25 * 3); // more coverage, more score

    // Position bonus: up to ~10
    $posScore = min(10, $posBonus);

    $baseScore = $phraseScore + $kwFreqScore + $lsiScore + $posScore;
    if ($baseScore > 100) {
        $baseScore = 100;
    }

    ////////////////////////////
    // Spam penalty
    ////////////////////////////

    $penalty = 0;

    // Penalize if density is too high
    // > 3 percent: small penalty
    // > 5 percent: stronger
    // > 8 percent: heavy
    if ($kwPercent > 3.0 && $kwPercent <= 5.0) {
        $penalty += ($kwPercent - 3.0) * 5;  // up to 10 off
    } elseif ($kwPercent > 5.0 && $kwPercent <= 8.0) {
        $penalty += 10 + ($kwPercent - 5.0) * 6; // extra up to ~28 off
    } elseif ($kwPercent > 8.0) {
        $penalty += 28 + ($kwPercent - 8.0) * 8; // very spammy
    }

    // Also penalize absurd phrase repetitions
    if ($phraseCount > 3) {
        $penalty += ($phraseCount - 3) * 5;
    }

    $final = $baseScore - $penalty;

    if ($final < 0)   $final = 0;
    if ($final > 100) $final = 100;

    return (int) round($final);
}
