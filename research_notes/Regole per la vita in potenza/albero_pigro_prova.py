import math, random, hashlib, struct
# --- numeri di servizio
def lam_len(D,k): return math.sqrt(D/k)
for name,D,k in [("Cyclops",0.7,1.22e-4),("Squint",3.2,1.00e-4),("Lefty1",11.1,0.53e-4),("Lefty2",18.9,0.69e-4)]:
    print(name,"lambda=%.0f um"%lam_len(D,k),"1/k=%.1f h"%(1/k/3600))
print("Bicoid k for lambda=100um: D=7 ->",7/1e4,"1/s tau(min)=",1/(7/1e4)/60," ; D=0.3 ->",0.3/1e4,"tau(h)=",1/(0.3/1e4)/3600)
print("Berg-Purcell T for 10%:",100/(1*3e-3*4.8),"s")
N=1e4;s=0.01
print("Kimura fix s=0.01,N=1e4:",(1-math.exp(-2*s))/(1-math.exp(-4*N*s)),"neutral",1/(2*N),"t_fix~",2/s*math.log(2*N))
print("1.01^1829=",1.01**1829)
print("2mu t =1 at t(Myr)=",1/(2*2.2e-9)/1e6)
# JC: p at d
for d in [0.1,0.5,1,2,3,5]:
    p=0.75*(1-math.exp(-4*d/3)); L=1000
    se=math.sqrt(p*(1-p)/L)/(1-4*p/3)
    print("d=%.1f p=%.3f se(d,L=1000)=%.3f"%(d,p,se))
# BD: solve r for E[N]=F(T)
def F(t,lam,r,p=1.0): return 1+(p*lam/r)*(math.exp(r*t)-1) if abs(r)>1e-15 else 1+p*lam*t
lam=0.5; T=1800.0; target=8.7e6
lo,hi=1e-6,0.1
for _ in range(200):
    mid=(lo+hi)/2
    if F(T,lam,mid)<target: lo=mid
    else: hi=mid
r=lo; print("r=%.5f /Myr  mu/lam=%.4f  critical E[N]=%.0f"%(r,(lam-r)/lam,1+lam*T))
# --- campionatore pigro dei massimi di blocco per un CPP
def Ginv(q,lam,r,T,p=1.0):
    PT=1-1/F(T,lam,r,p)      # P(H<=T)
    x=q*PT                   # P(H<=t)
    return math.log(1+(r/(p*lam))*x/(1-x))/r
def G(t,lam,r,T,p=1.0): return (1-1/F(t,lam,r,p))/(1-1/F(T,lam,r,p))
def u(seed,*a):
    h=hashlib.sha256(struct.pack(">q",seed)+b"|"+",".join(map(str,a)).encode()).digest()
    return (int.from_bytes(h[:7],"big")+0.5)/2**56
class Lazy:
    def __init__(s,seed,K,lam,r,T): s.seed,s.K,s.lam,s.r,s.T=seed,K,lam,r,T; s.cache={}
    def node(s,level,idx):
        # max of block (level 0 = root with 2^K gaps); returns G-quantile of the max
        if (level,idx) in s.cache: return s.cache[(level,idx)]
        if level==0: q=u(s.seed,0,0)**(1.0/2**s.K)
        else:
            par=s.node(level-1,idx>>1); m=2**(s.K-level)
            heavy=1 if u(s.seed,"side",level-1,idx>>1)<0.5 else 0
            q=par if (idx&1)==heavy else par*u(s.seed,level,idx)**(1.0/m)
        s.cache[(level,idx)]=q; return q
    def rangemax(s,a,b,level=0,idx=0):
        # max quantile over gaps [a,b)
        lo=idx<<(s.K-level); hi=lo+(1<<(s.K-level))
        if a<=lo and hi<=b: return s.node(level,idx)
        if b<=lo or hi<=a: return 0.0
        return max(s.rangemax(a,b,level+1,2*idx),s.rangemax(a,b,level+1,2*idx+1))
    def div(s,i,j):
        if i>j: i,j=j,i
        return Ginv(s.rangemax(i,j),s.lam,s.r,s.T)
K=12; n=2**K
random.seed(1)
# confronto: distribuzione del tempo di divergenza tra foglie a distanza g (in numero di intervalli)
import statistics
for g in [1,7,64,1000]:
    lazy=[];direct=[]
    for rep in range(3000):
        Lz=Lazy(rep,K,lam,r,T); i=random.randrange(0,n-g); lazy.append(Lz.div(i,i+g))
        direct.append(Ginv(max(random.random() for _ in range(g)),lam,r,T))
    lazy.sort();direct.sort()
    ks=max(abs(lazy[k]-direct[k]) for k in range(len(lazy)))  # crude
    print("gap",g,"mean lazy %.1f direct %.1f | median %.1f %.1f | q10 %.1f %.1f"%(statistics.mean(lazy),statistics.mean(direct),lazy[1500],direct[1500],lazy[300],direct[300]))
# coerenza ultrametrica: div(i,k) = max(div(i,j),div(j,k))
Lz=Lazy(42,K,lam,r,T); bad=0
for _ in range(2000):
    i,j,k=sorted(random.sample(range(n),3)); 
    if abs(Lz.div(i,k)-max(Lz.div(i,j),Lz.div(j,k)))>1e-9: bad+=1
print("violazioni ultrametriche:",bad, " nodi calcolati:",len(Lz.cache),"su",2**(K+1)-1)
Lz=Lazy(7,40,lam,r,T); print("2^40 tips: div(3,4)=%.2f Myr div(3,10**11)=%.1f Myr nodi calcolati=%d"%(Lz.div(3,4),Lz.div(3,10**11),len(Lz.cache)))
