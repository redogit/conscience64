#include <algorithm>
#include <array>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <numeric>
#include <set>
#include <string>
#include <vector>

namespace {
using V6 = std::array<long long, 6>;
using M6 = std::array<V6, 6>;

long long bareiss_det(std::vector<std::vector<long long>> a) {
    const int n = static_cast<int>(a.size());
    if (n == 0) return 1;
    long long sign = 1;
    long long previous = 1;
    for (int k = 0; k < n - 1; ++k) {
        int pivot_row = k;
        while (pivot_row < n && a[pivot_row][k] == 0) ++pivot_row;
        if (pivot_row == n) return 0;
        if (pivot_row != k) {
            std::swap(a[pivot_row], a[k]);
            sign = -sign;
        }
        const long long pivot = a[k][k];
        for (int i = k + 1; i < n; ++i) {
            for (int j = k + 1; j < n; ++j) {
                __int128 numerator = static_cast<__int128>(a[i][j]) * pivot
                                   - static_cast<__int128>(a[i][k]) * a[k][j];
                if (k > 0) numerator /= previous;
                a[i][j] = static_cast<long long>(numerator);
            }
            a[i][k] = 0;
        }
        previous = pivot;
    }
    return sign * a[n - 1][n - 1];
}

long long minor_det(const M6& a, int skip_row, int skip_col) {
    std::vector<std::vector<long long>> minor;
    for (int i = 0; i < 6; ++i) {
        if (i == skip_row) continue;
        std::vector<long long> row;
        for (int j = 0; j < 6; ++j) {
            if (j != skip_col) row.push_back(a[i][j]);
        }
        minor.push_back(std::move(row));
    }
    return bareiss_det(std::move(minor));
}

std::vector<V6> degree_three_monomials() {
    std::vector<V6> out;
    for (int a = 0; a <= 3; ++a)
        for (int b = 0; b <= 3 - a; ++b)
            for (int c = 0; c <= 3 - a - b; ++c)
                for (int d = 0; d <= 3 - a - b - c; ++d)
                    for (int e = 0; e <= 3 - a - b - c - d; ++e) {
                        const int f = 3 - a - b - c - d - e;
                        out.push_back(V6{a, b, c, d, e, f});
                    }
    return out;
}

std::vector<V6> support_for(const std::string& family) {
    std::vector<V6> support;
    for (const auto& v : degree_three_monomials()) {
        bool keep = false;
        if (family == "phi3_3") {
            const long long first_four = v[0] + v[1] + v[2] + v[3];
            keep = (v[4] + v[5] == 0)
                || (v[4] == 3 && first_four + v[5] == 0)
                || (v[5] == 3 && first_four + v[4] == 0)
                || (v[4] == 1 && v[5] == 1 && first_four == 1);
        } else if (family == "phi4_3") {
            const long long left = v[0] + v[1] + v[2];
            const long long right = v[3] + v[4] + v[5];
            keep = (left == 3 && right == 0) || (left == 0 && right == 3);
        } else if (family == "phi6_3") {
            const long long s0 = v[0] + v[1];
            const long long s1 = v[2] + v[3];
            const long long s2 = v[4] + v[5];
            keep = (s0 == 3 && s1 == 0 && s2 == 0)
                || (s0 == 0 && s1 == 3 && s2 == 0)
                || (s0 == 0 && s1 == 0 && s2 == 3)
                || (s0 == 1 && s1 == 1 && s2 == 1);
        } else if (family == "phi1_5") {
            const int sigma[6] = {0, 0, 1, 2, 3, 4};
            long long weight = 0;
            for (int i = 0; i < 6; ++i) weight += sigma[i] * v[i];
            keep = (weight % 5 == 0);
        } else if (family == "phi1_7") {
            const int sigma[6] = {1, 2, 3, 4, 5, 6};
            long long weight = 0;
            for (int i = 0; i < 6; ++i) weight += sigma[i] * v[i];
            keep = (weight % 7 == 0);
        } else if (family == "phi1_11") {
            const int sigma[6] = {0, 1, 3, 4, 5, 9};
            long long weight = 0;
            for (int i = 0; i < 6; ++i) weight += sigma[i] * v[i];
            keep = (weight % 11 == 0);
        }
        if (keep) support.push_back(v);
    }
    std::sort(support.begin(), support.end());
    support.erase(std::unique(support.begin(), support.end()), support.end());
    return support;
}

std::set<V6> w114_orbits() {
    const std::vector<V6> representatives = {
        V6{1, 7, 78, 79, 86, 91},
        V6{1, 13, 43, 72, 103, 110},
        V6{1, 13, 43, 80, 102, 103},
    };
    std::set<V6> orbit;
    for (const auto& target : representatives) {
        for (int u = 1; u < 114; ++u) {
            if (std::gcd(u, 114) != 1) continue;
            V6 scaled{};
            for (int i = 0; i < 6; ++i) scaled[i] = (u * target[i]) % 114;
            std::sort(scaled.begin(), scaled.end());
            orbit.insert(scaled);
        }
    }
    return orbit;
}

std::set<V6> target_orbit(long long level, const std::vector<V6>& representatives) {
    std::set<V6> orbit;
    for (const auto& target : representatives) {
        for (int u = 1; u < level; ++u) {
            if (std::gcd(static_cast<long long>(u), level) != 1) continue;
            V6 scaled{};
            for (int i = 0; i < 6; ++i) scaled[i] = (u * target[i]) % level;
            std::sort(scaled.begin(), scaled.end());
            orbit.insert(scaled);
        }
    }
    return orbit;
}

bool level_inverse(const M6& a, long long level, M6& b) {
    std::vector<std::vector<long long>> dense(6, std::vector<long long>(6));
    for (int i = 0; i < 6; ++i)
        for (int j = 0; j < 6; ++j)
            dense[i][j] = a[i][j];
    const long long det = bareiss_det(std::move(dense));
    if (det == 0) return false;

    for (int i = 0; i < 6; ++i) {
        for (int j = 0; j < 6; ++j) {
            long long cofactor = minor_det(a, j, i);
            if ((i + j) & 1) cofactor = -cofactor;
            const __int128 numerator = static_cast<__int128>(level) * cofactor;
            if (numerator % det != 0) return false;
            b[i][j] = static_cast<long long>(numerator / det);
        }
    }

    for (int i = 0; i < 6; ++i) {
        for (int j = 0; j < 6; ++j) {
            long long ab = 0;
            long long ba = 0;
            for (int k = 0; k < 6; ++k) {
                ab += a[i][k] * b[k][j];
                ba += b[i][k] * a[k][j];
            }
            const long long expected = (i == j ? level : 0);
            if (ab != expected || ba != expected) std::abort();
        }
    }
    return true;
}

struct Stats {
    long long total = 0;
    long long invertible = 0;
    long long integer_cover = 0;
    long long valid_pullbacks = 0;
    long long hits = 0;
    std::set<V6> distinct;
};

void enumerate_combinations(const std::vector<V6>& support,
                            int start,
                            int depth,
                            std::array<int, 6>& chosen,
                            const std::set<V6>& targets,
                            long long level,
                            Stats& stats) {
    if (depth < 6) {
        for (int i = start; i <= static_cast<int>(support.size()) - (6 - depth); ++i) {
            chosen[depth] = i;
            enumerate_combinations(support, i + 1, depth + 1, chosen, targets, level, stats);
        }
        return;
    }

    ++stats.total;
    M6 a{};
    for (int i = 0; i < 6; ++i) a[i] = support[chosen[i]];

    std::vector<std::vector<long long>> dense(6, std::vector<long long>(6));
    for (int i = 0; i < 6; ++i)
        for (int j = 0; j < 6; ++j)
            dense[i][j] = a[i][j];
    if (bareiss_det(dense) == 0) return;
    ++stats.invertible;

    M6 b{};
    if (!level_inverse(a, level, b)) return;
    ++stats.integer_cover;

    for (const auto& exponent : degree_three_monomials()) {
        V6 alpha{};
        bool valid = true;
        for (int j = 0; j < 6; ++j) {
            long long value = level / 3;
            for (int i = 0; i < 6; ++i) value += exponent[i] * b[i][j];
            value %= level;
            if (value < 0) value += level;
            alpha[j] = value;
            if (value == 0) valid = false;
        }
        if (!valid) continue;
        ++stats.valid_pullbacks;
        V6 canonical = alpha;
        std::sort(canonical.begin(), canonical.end());
        stats.distinct.insert(canonical);
        if (targets.count(canonical)) ++stats.hits;
    }
}

Stats screen_family(const std::string& family, const std::set<V6>& targets, long long level) {
    const auto support = support_for(family);
    std::array<int, 6> chosen{};
    Stats stats;
    enumerate_combinations(support, 0, 0, chosen, targets, level, stats);
    return stats;
}

V6 positive_control() {
    M6 a{};
    for (int i = 0; i < 5; ++i) {
        a[i][i] = 2;
        a[i][(i + 1) % 5] = 1;
    }
    a[5][5] = 3;
    M6 b{};
    if (!level_inverse(a, 33, b)) std::abort();
    const V6 exponent{1, 0, 0, 0, 1, 1};
    V6 alpha{};
    for (int j = 0; j < 6; ++j) {
        long long value = 11;
        for (int i = 0; i < 6; ++i) value += exponent[i] * b[i][j];
        value %= 33;
        if (value < 0) value += 33;
        alpha[j] = value;
    }
    return alpha;
}

void print_vector(const V6& v) {
    std::cout << "[";
    for (int i = 0; i < 6; ++i) {
        if (i) std::cout << ",";
        std::cout << v[i];
    }
    std::cout << "]";
}
}  // namespace

int main() {
    const auto targets = w114_orbits();
    const std::vector<std::string> families = {"phi3_3", "phi4_3", "phi6_3"};
    std::vector<Stats> rows;
    for (const auto& family : families) rows.push_back(screen_family(family, targets, 114));

    const auto w70_210_targets = target_orbit(210, {V6{2, 9, 129, 142, 168, 180}});
    const auto w114_570_targets = target_orbit(570, {V6{5, 35, 390, 395, 430, 455}});
    const Stats p5_w70_210 = screen_family("phi1_5", w70_210_targets, 210);
    const Stats p5_w114_570 = screen_family("phi1_5", w114_570_targets, 570);

    // Canonical power-map lifts pi_3: X_{3m} -> X_m, [x_i] -> [x_i^3].
    // The pulled-back character is exactly 3*alpha, so algebraicity of a
    // canonical lift descends rationally by push-pull if a valid target cycle is found.
    const V6 canonical_w70_210{3, 60, 72, 126, 183, 186};
    const V6 canonical_w110_330{3, 72, 186, 213, 243, 273};
    const auto canonical_w70_targets = target_orbit(210, {canonical_w70_210});
    const auto canonical_w110_targets = target_orbit(330, {canonical_w110_330});

    struct CanonicalRow { std::string family; std::string wall; long long level; V6 target; Stats stats; };
    std::vector<CanonicalRow> canonical_rows;
    for (const std::string& family : {std::string("phi3_3"), std::string("phi4_3"), std::string("phi6_3")}) {
        canonical_rows.push_back({family, "W70", 210, canonical_w70_210,
                                  screen_family(family, canonical_w70_targets, 210)});
        canonical_rows.push_back({family, "W110", 330, canonical_w110_330,
                                  screen_family(family, canonical_w110_targets, 330)});
    }
    canonical_rows.push_back({"phi1_5", "W70", 210, canonical_w70_210,
                              screen_family("phi1_5", canonical_w70_targets, 210)});
    canonical_rows.push_back({"phi1_5", "W110", 330, canonical_w110_330,
                              screen_family("phi1_5", canonical_w110_targets, 330)});
    canonical_rows.push_back({"phi1_7", "W70", 210, canonical_w70_210,
                              screen_family("phi1_7", canonical_w70_targets, 210)});
    canonical_rows.push_back({"phi1_11", "W110", 330, canonical_w110_330,
                              screen_family("phi1_11", canonical_w110_targets, 330)});

    const V6 control = positive_control();
    const V6 expected{19, 7, 13, 10, 28, 22};

    std::cout << "{\n";
    std::cout << "  \"schema\":\"conscience64/hodge-even-wall-shioda-cubic-screen/v1\",\n";
    std::cout << "  \"target\":{\"wall\":\"W114\",\"level\":114},\n";
    std::cout << "  \"positive_control\":{\"alpha\":";
    print_vector(control);
    std::cout << ",\"expected\":";
    print_vector(expected);
    std::cout << "},\n";
    std::cout << "  \"families\":[\n";
    for (std::size_t i = 0; i < families.size(); ++i) {
        const auto support_size = support_for(families[i]).size();
        const auto& s = rows[i];
        std::cout << "    {\"family\":\"" << families[i]
                  << "\",\"invariant_monomial_support\":" << support_size
                  << ",\"six_monomial_supports\":" << s.total
                  << ",\"invertible_supports\":" << s.invertible
                  << ",\"integer_level_114_covers\":" << s.integer_cover
                  << ",\"valid_degree3_pullbacks\":" << s.valid_pullbacks
                  << ",\"distinct_canonical_pullbacks\":" << s.distinct.size()
                  << ",\"w114_hits\":" << s.hits << "}";
        if (i + 1 != families.size()) std::cout << ",";
        std::cout << "\n";
    }
    std::cout << "  ],\n";
    const auto p5_support_size = support_for("phi1_5").size();
    std::cout << "  \"phi1_5_lifted_screens\":[\n";
    auto print_lift = [&](const char* wall, int level, const Stats& st, bool comma) {
        std::cout << "    {\"family\":\"phi1_5\",\"wall\":\"" << wall
                  << "\",\"level\":" << level
                  << ",\"invariant_monomial_support\":" << p5_support_size
                  << ",\"six_monomial_supports\":" << st.total
                  << ",\"invertible_supports\":" << st.invertible
                  << ",\"integer_covers\":" << st.integer_cover
                  << ",\"valid_degree3_pullbacks\":" << st.valid_pullbacks
                  << ",\"distinct_canonical_pullbacks\":" << st.distinct.size()
                  << ",\"hits\":" << st.hits << "}";
        if (comma) std::cout << ",";
        std::cout << "\n";
    };
    print_lift("W70", 210, p5_w70_210, true);
    print_lift("W114", 570, p5_w114_570, false);
    std::cout << "  ],\n";
    std::cout << "  \"canonical_power_lift_screens\":[\n";
    for (std::size_t i = 0; i < canonical_rows.size(); ++i) {
        const auto& row = canonical_rows[i];
        std::cout << "    {\"family\":\"" << row.family
                  << "\",\"wall\":\"" << row.wall
                  << "\",\"level\":" << row.level
                  << ",\"target\":";
        print_vector(row.target);
        std::cout << ",\"invariant_monomial_support\":" << support_for(row.family).size()
                  << ",\"six_monomial_supports\":" << row.stats.total
                  << ",\"invertible_supports\":" << row.stats.invertible
                  << ",\"integer_covers\":" << row.stats.integer_cover
                  << ",\"valid_degree3_pullbacks\":" << row.stats.valid_pullbacks
                  << ",\"distinct_canonical_pullbacks\":" << row.stats.distinct.size()
                  << ",\"hits\":" << row.stats.hits << "}";
        if (i + 1 != canonical_rows.size()) std::cout << ",";
        std::cout << "\n";
    }
    std::cout << "  ],\n";
    std::cout << "  \"claim_ceiling\":\"Finite Shioda-character obstruction only: direct W114@114 screens in the three prime-order-3 cubic support families; phi1_5 screens at the previously used W70@210 and canonical W114@570 targets; and canonical pi_3 power-map lifts W70@210 and W110@330 screened against compatible Billi-Grossi-Marquand prime-order Delsarte support families. Other cubics, non-Delsarte targets, other lifts/descent maps, coherent sheaves, and matrix factorizations remain open.\"\n";
    std::cout << "}\n";
    return control == expected ? 0 : 3;
}
