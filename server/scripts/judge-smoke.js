#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   End-to-end judge check.

   Submits a correct Solution-class answer for a representative problem from
   each input layout, output shape and language, and asserts the verdict is
   ACCEPTED against the full test set — hidden cases included.

   Exercises what every question shares: stdin delivery, the parameter sizing
   plan, the generated wrapper per language, output formatting, and the
   comparison with its float tolerance.

     node scripts/judge-smoke.js
   ═══════════════════════════════════════════════════════════════════════════ */

const API = 'http://localhost:4000';
const EMAIL = 'judge.smoke@example.com', PASSWORD = 'Smoke12345!';

// Solution-class solutions, exactly what the restored template gives the user.
const CASES = [
  { title:'Count Even Numbers', why:'int n + array', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int countEvenNumbers(int n, vector<int> arr) {
        int c=0; for (int x: arr) if (x%2==0) c++; return c;
    }
};` },
  { title:'Greatest Common Divisor', why:'two ints on ONE line (was broken)', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int greatestCommonDivisor(int a, int b) { while(b){int t=a%b;a=b;b=t;} return a; }
};` },
  { title:'Kth Smallest Element', why:'int n, int k + array (k must not size the array)', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int kthSmallestElement(int n, int k, vector<int> arr) {
        sort(arr.begin(), arr.end()); return arr[k-1];
    }
};` },
  { title:'Element-wise Sum', why:'two equal-length arrays; vector<int> return -> space separated', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<int> elementWiseSum(int n, vector<int> a, vector<int> b) {
        vector<int> r; for (int i = 0; i < n; i++) r.push_back(a[i] + b[i]); return r;
    }
};` },
  { title:'Sum of Digits', why:'scalar-only Java Solution class', lang:'JAVA', src:
`class Solution {
    public int sumOfDigits(int n) {
        int s = 0; while (n > 0) { s += n % 10; n /= 10; } return s;
    }
}` },
  { title:'Largest Element in an Array', why:'Python list[int] Solution class', lang:'PYTHON', src:
`class Solution:
    def largestElementInAnArray(self, n: int, arr: list[int]) -> int:
        return max(arr)` },
  { title:'Transpose a Matrix', why:'n x m grid in, matrix out', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    vector<vector<int>> transposeAMatrix(int n, int m, vector<vector<int>> grid) {
        vector<vector<int>> r(m, vector<int>(n));
        for (int i=0;i<n;i++) for (int j=0;j<m;j++) r[j][i]=grid[i][j];
        return r;
    }
};` },
  { title:'Connected Components', why:'edge list: m rows of 2, not n x m', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int connectedComponents(int n, int m, vector<vector<int>> edges) {
        vector<int> p(n+1); for(int i=0;i<=n;i++) p[i]=i;
        function<int(int)> f=[&](int x){ while(p[x]!=x){p[x]=p[p[x]];x=p[x];} return x; };
        for (auto& e: edges){ int a=f(e[0]), b=f(e[1]); if(a!=b) p[a]=b; }
        set<int> s; for(int i=1;i<=n;i++) s.insert(f(i)); return s.size();
    }
};` },
  { title:'Minimum Meeting Rooms', why:'n rows of 2, width derived', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int minimumMeetingRooms(int n, vector<vector<int>> meetings) {
        vector<pair<int,int>> ev;
        for (auto& m: meetings){ ev.push_back({m[0],1}); ev.push_back({m[1],-1}); }
        sort(ev.begin(), ev.end());
        int cur=0,best=0; for(auto&e:ev){cur+=e.second;best=max(best,cur);} return best;
    }
};` },
  { title:'Count Anagram Groups', why:'vector<string> input', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    int countAnagramGroups(int n, vector<string> words) {
        set<string> s; for (auto w: words){ sort(w.begin(), w.end()); s.insert(w);} return s.size();
    }
};` },
  { title:'Mean of an Array', why:'double return, float tolerance', lang:'CPP', src:
`#include <bits/stdc++.h>
using namespace std;
class Solution {
public:
    double meanOfAnArray(int n, vector<int> arr) {
        double s=0; for(int x:arr) s+=x; return s/n;
    }
};` },
  { title:'Reverse a String', why:'string in/out, Python Solution class', lang:'PYTHON', src:
`class Solution:
    def reverseAString(self, s: str) -> str:
        return s[::-1]` },
  { title:'Longest Common Subsequence', why:'two strings, Java Solution class', lang:'JAVA', src:
`class Solution {
    public int longestCommonSubsequence(String s, String t) {
        int[][] dp = new int[s.length()+1][t.length()+1];
        for (int i=1;i<=s.length();i++)
            for (int j=1;j<=t.length();j++)
                dp[i][j] = s.charAt(i-1)==t.charAt(j-1) ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
        return dp[s.length()][t.length()];
    }
}` },
  { title:'Sum of Array Elements', why:'JavaScript function form', lang:'JAVASCRIPT', src:
`var sumOfArrayElements = function(n, arr) {
    return arr.reduce((a,b)=>a+b, 0);
};` },
];

const http = async (p, o={}) => { const r = await fetch(API+p, o); const t = await r.text();
  let j=null; try{ j=JSON.parse(t);}catch{} return {status:r.status, json:j, text:t}; };
const sleep = ms => new Promise(r=>setTimeout(r,ms));

(async () => {
  await http('/api/v1/register',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:'Judge Smoke',email:EMAIL,password:PASSWORD,role:'USER'})});
  const login = await http('/api/v1/login',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:EMAIL,password:PASSWORD})});
  const token = login.json?.accessToken || login.json?.token;
  if (!token) throw new Error('no token: '+login.text.slice(0,200));
  const auth = {Authorization:'Bearer '+token,'Content-Type':'application/json'};

  const all = await http('/api/v1/questions/getAll',{headers:auth});
  const idByTitle = new Map((all.json||[]).map(q=>[q.title,q.id]));

  let pass=0; const fails=[];
  for (const c of CASES) {
    const id = idByTitle.get(c.title);
    if (!id) { fails.push(c.title+': not found'); console.log('  MISSING  '+c.title); continue; }
    const created = await http('/api/v1/submissions/create',{method:'POST',headers:auth,
      body:JSON.stringify({questionId:id, language:c.lang, sourceCode:c.src})});
    const sid = created.json?.submissionId;
    if (!sid) { fails.push(c.title+': '+created.text.slice(0,120)); console.log('  REJECT   '+c.title); continue; }
    let v=null;
    for (let i=0;i<40;i++){ await sleep(1500);
      const s = await http('/api/v1/submissions/getById/'+sid,{headers:auth});
      const st=s.json?.status; if(st && st!=='PENDING' && st!=='RUNNING'){ v=s.json; break; } }
    const label = (c.lang+'  '+c.title).padEnd(46);
    if (!v) { fails.push(c.title+': timeout'); console.log('  TIMEOUT  '+label); }
    else if (v.status==='ACCEPTED' && v.passed_testcases===v.total_testcases) {
      pass++; console.log('  PASS     '+label+v.passed_testcases+'/'+v.total_testcases+'  ('+c.why+')');
    } else {
      fails.push(c.title+': '+v.status+' '+v.passed_testcases+'/'+v.total_testcases);
      console.log('  FAIL     '+label+v.status+' '+v.passed_testcases+'/'+v.total_testcases+'  ('+c.why+')');
    }
  }
  console.log('\n'+pass+'/'+CASES.length+' accepted');
  if (fails.length) { console.log('\nFailures:'); fails.forEach(f=>console.log('  - '+f)); }
})();
