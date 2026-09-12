#include <bits/stdc++.h>
using namespace std;
struct State {array<uint16_t,6> a{}; uint8_t n=0; bool operator==(State const&o)const{return n==o.n && a==o.a;}};
struct H {size_t operator()(State const&s)const noexcept{size_t h=s.n; for(int i=0;i<s.n;i++) h=(h*1000003)^s.a[i]; return h;}};
struct Perm {array<int,4> p; array<int,16> map;};
uint16_t vars4[4];
vector<uint16_t> build_class(){
  for(int j=0;j<4;j++){vars4[j]=0;for(int x=0;x<16;x++)if((x>>j)&1)vars4[j]|=uint16_t(1)<<x;}
  unordered_set<State,H> all,cur,nxt; State z;all.insert(z);cur.insert(z);
  unordered_set<uint16_t> funcs; funcs.reserve(4000); funcs.insert(0);funcs.insert(0xffff);for(auto v:vars4)funcs.insert(v);
  for(int d=1;d<=6;d++){
    nxt.clear();nxt.reserve(cur.size()*5);
    for(auto const&s:cur){
      uint16_t sig[10];int m=0;for(auto v:vars4)sig[m++]=v;for(int i=0;i<s.n;i++)sig[m++]=s.a[i];
      for(int i=0;i<m;i++)for(int j=i;j<m;j++){
        uint16_t f=uint16_t(~(sig[i]&sig[j]));
        bool ex=false;for(int k=0;k<4;k++)if(vars4[k]==f)ex=true;for(int k=0;k<s.n;k++)if(s.a[k]==f)ex=true;if(ex)continue;
        State t=s;t.a[t.n++]=f;sort(t.a.begin(),t.a.begin()+t.n);
        if(all.find(t)==all.end())nxt.insert(t); funcs.insert(f);
      }
    }
    for(auto const&s:nxt)all.insert(s); cur.swap(nxt);
  }
  vector<uint16_t> v(funcs.begin(),funcs.end());sort(v.begin(),v.end());return v;
}
vector<Perm> perms(){
 vector<Perm> r; array<int,4> p={0,1,2,3}; do{Perm q;q.p=p;for(int x=0;x<16;x++){int y=0;for(int i=0;i<4;i++)if((x>>i)&1)y|=1<<p[i];q.map[x]=y;}r.push_back(q);}while(next_permutation(p.begin(),p.end()));return r;
}
struct Index {int N,W; vector<array<vector<uint64_t>,2>> mask; Index(vector<uint16_t> const&f):N(f.size()),W((N+63)/64),mask(16){for(int x=0;x<16;x++)for(int b=0;b<2;b++)mask[x][b].assign(W,0);for(int i=0;i<N;i++)for(int x=0;x<16;x++){int b=(f[i]>>x)&1;mask[x][b][i>>6]|=1ull<<(i&63);}}
 long count1(vector<uint64_t> const&s,int x,int b,long long &ops)const{long c=0;for(int w=0;w<W;w++){c+=__builtin_popcountll(s[w]&mask[x][b][w]);ops++;}return c;}
 long count2(vector<uint64_t> const&s,int x,int y,int b,long long &ops)const{long c=0;for(int w=0;w<W;w++){c+=__builtin_popcountll(s[w]&mask[x][b][w]&mask[y][b][w]);ops+=2;}return c;}
 void apply1(vector<uint64_t>&s,int x,int b)const{for(int w=0;w<W;w++)s[w]&=mask[x][b][w];}
 void apply2(vector<uint64_t>&s,int x,int y,int b)const{for(int w=0;w<W;w++)s[w]&=mask[x][b][w]&mask[y][b][w];}
 long pop(vector<uint64_t>const&s)const{long c=0;for(auto z:s)c+=__builtin_popcountll(z);return c;}
};
using Obs=array<int,16>;
bool preserves(Perm const&p,Obs const&o){for(int x=0;x<16;x++)if(o[x]>=0){int y=p.map[x];if(o[y]!=o[x])return false;}return true;}
vector<int> stab(vector<Perm>const&ps,Obs const&o,int t=-1){vector<int> g;for(int i=0;i<(int)ps.size();i++)if(preserves(ps[i],o)&&(t<0||ps[i].map[t]==t))g.push_back(i);return g;}
vector<int> coord_reps(vector<Perm>const&ps,vector<int>const&G,Obs const&o){vector<int> reps;bool seen[16]={};for(int x=0;x<16;x++)if(o[x]<0&&!seen[x]){int rep=x;vector<int> orb;for(int gi:G){int y=ps[gi].map[x];if(o[y]<0){orb.push_back(y);rep=min(rep,y);}}for(int y:orb)seen[y]=true;seen[x]=true;reps.push_back(rep);}sort(reps.begin(),reps.end());return reps;}
int paircanon(int x,int t){return min(x,x^t);}
vector<int> pair_reps(vector<Perm>const&ps,vector<int>const&G,Obs const&o,int t){bool seen[16]={};vector<int> reps;for(int x=0;x<16;x++){int c=paircanon(x,t);if(c!=x||seen[c])continue;int y=x^t;if(o[x]>=0||o[y]>=0)continue;set<int> orb;for(int gi:G){int a=ps[gi].map[x],cc=paircanon(a,t);int bb=cc^t;if(o[cc]<0&&o[bb]<0)orb.insert(cc);}int rep=*orb.begin();for(int z:orb)seen[z]=true;reps.push_back(rep);}sort(reps.begin(),reps.end());return reps;}
struct R {string name;int obs=0,scores=0;long long wordops=0;vector<long> path;vector<pair<int,int>> picks;int t=-1;};
R paired_continue(Index const&idx,vector<Perm>const&ps,int t, optional<tuple<Obs,vector<uint64_t>,R>> init=nullopt){R r;Obs o;vector<uint64_t>s;if(init){o=get<0>(*init);s=get<1>(*init);r=get<2>(*init);}else{o.fill(-1);s.assign(idx.W,~0ull);if(idx.N%64)s.back()=(1ull<<(idx.N%64))-1;r.path.push_back(idx.N);r.t=t;r.name="paired_t"+to_string(t);}while(idx.pop(s)>0){auto G=stab(ps,o,t);auto reps=pair_reps(ps,G,o,t);if(reps.empty())break;long best=LLONG_MAX;int bx=-1,bb=-1;for(int x:reps)for(int b=0;b<2;b++){r.scores++;long c=idx.count2(s,x,x^t,b,r.wordops);if(c<best||tuple<long,int,int>(c,x,b)<tuple<long,int,int>(best,bx,bb)){best=c;bx=x;bb=b;}}o[bx]=o[bx^t]=bb;idx.apply2(s,bx,bx^t,bb);r.obs+=2;r.picks.push_back({bx,bb});r.path.push_back(idx.pop(s));if(r.path.back()==0)break;}return r;}
int main(){auto f=build_class();cout<<"class="<<f.size()<<"\n";if(f.size()!=3310)return 2;Index idx(f);auto ps=perms();
 R g; {Obs o;o.fill(-1);vector<uint64_t>s(idx.W,~0ull);if(idx.N%64)s.back()=(1ull<<(idx.N%64))-1;g.name="generic_sym";g.path.push_back(idx.N);while(idx.pop(s)>0){auto G=stab(ps,o);auto reps=coord_reps(ps,G,o);long best=LLONG_MAX;int bx=-1,bb=-1;for(int x:reps)for(int b=0;b<2;b++){g.scores++;long c=idx.count1(s,x,b,g.wordops);if(c<best||tuple<long,int,int>(c,x,b)<tuple<long,int,int>(best,bx,bb)){best=c;bx=x;bb=b;}}o[bx]=bb;idx.apply1(s,bx,bb);g.obs++;g.picks.push_back({bx,bb});g.path.push_back(idx.pop(s));if(g.path.back()==0)break;}}
 auto print=[&](R const&r){cout<<r.name<<" obs="<<r.obs<<" scores="<<r.scores<<" wordops="<<r.wordops<<" path=";for(auto x:r.path)cout<<x<<",";cout<<" picks=";for(auto [x,b]:r.picks)cout<<"("<<x<<","<<b<<")";cout<<"\n";};print(g);
 for(int t:{1,3,7,15}){R r=paired_continue(idx,ps,t);print(r);}
 long long selops=0; int selscores=0,bestt=-1,bx=-1,bb=-1;long best=LLONG_MAX;
 for(int t:{1,3,7,15}){Obs o;o.fill(-1);vector<uint64_t>s(idx.W,~0ull);if(idx.N%64)s.back()=(1ull<<(idx.N%64))-1;auto G=stab(ps,o,t);auto reps=pair_reps(ps,G,o,t);long local=LLONG_MAX;int lx=-1,lb=-1;for(int x:reps)for(int b=0;b<2;b++){selscores++;long c=idx.count2(s,x,x^t,b,selops);if(c<local||tuple<long,int,int>(c,x,b)<tuple<long,int,int>(local,lx,lb)){local=c;lx=x;lb=b;}}cout<<"first t="<<t<<" reps="<<reps.size()<<" best="<<local<<" pick="<<lx<<","<<lb<<"\n";if(local<best||pair<long,int>(local,t)<pair<long,int>(best,bestt)){best=local;bestt=t;bx=lx;bb=lb;}}
 Obs o;o.fill(-1);vector<uint64_t>s(idx.W,~0ull);if(idx.N%64)s.back()=(1ull<<(idx.N%64))-1;o[bx]=o[bx^bestt]=bb;idx.apply2(s,bx,bx^bestt,bb);R init;init.name="selector_then_paired";init.t=bestt;init.obs=2;init.scores=selscores;init.wordops=selops;init.picks.push_back({bx,bb});init.path={idx.N,idx.pop(s)};R rr=paired_continue(idx,ps,bestt,make_optional(make_tuple(o,s,init)));print(rr);cout<<"selected_t="<<bestt<<" first_survivors="<<best<<"\n";
}
