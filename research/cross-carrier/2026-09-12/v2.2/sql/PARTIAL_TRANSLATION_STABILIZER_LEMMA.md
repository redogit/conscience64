# Explicit Partial Translation Stabilizer Lemma

Let \(P:D\to\{0,1\}\) be an explicitly listed partial Boolean function with
\(D\subseteq\mathbb F_2^n\) and \(|D|=m\).

For nonzero \(t\in\mathbb F_2^n\), define \(N_t\) as the number of unordered
same-label pairs \(\{x,y\}\subseteq D\) such that \(x\oplus y=t\).

Then

\[
t\text{ stabilizes }P
\quad\Longleftrightarrow\quad
N_t=m/2.
\]

Here "stabilizes" means that for every \(x\in D\),
\(x\oplus t\in D\) and \(P(x\oplus t)=P(x)\).

## Proof

For fixed nonzero \(t\), every point \(x\) has at most one possible partner,
namely \(x\oplus t\). Therefore all unordered pairs having XOR difference
\(t\) are disjoint.

If \(t\) stabilizes \(P\), these pairs cover every point of \(D\), preserve
the label, and hence there are exactly \(m/2\) of them.

Conversely, if there are \(m/2\) same-label pairs with difference \(t\), the
pairs are disjoint and cover all \(m\) points. Thus every \(x\in D\) has
\(x\oplus t\in D\) with the same label, so \(t\) stabilizes \(P\).

## Algorithmic consequence

Enumerate all unordered same-label pairs, count their XOR differences, and
return every nonzero difference occurring exactly \(m/2\) times.

This uses \(O(m^2)\) pair operations and \(O(m^2 n)\) bit complexity for
explicit \(n\)-bit coordinates. It avoids enumeration of all \(2^n-1\)
possible translations.

This is a discovery result for an **explicit partial table**. It does not
supply an efficient way to construct a hard partial table, and it does not
imply an efficient symmetry-discovery algorithm for a succinctly represented
exponential domain.

## Countercheck

A deterministic random countercheck compared the pair-difference detector
against brute-force enumeration of every nonzero translation for 10,000
partial tables with \(1\le n\le 8\). No disagreement was found.

For the selected SQL-v2 ten-point target, both methods return exactly
`t = 7`.
