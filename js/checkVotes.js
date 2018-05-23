
now = new Date();
curators = {};
responses = 0;

steem_price = 0;
reward_balance = 0;
recent_claims = 0;

var rpc_nodes = [
  {url:"https://api.steemit.com",timeLastResponse:now},
  {url:"https://steemd.pevo.science",timeLastResponse:now},
  {url:"https://seed.bitcoiner.me",timeLastResponse:now},
  {url:"https://rpc.buildteam.io",timeLastResponse:now},
  {url:"https://minnowsupportproject.org",timeLastResponse:now},
  {url:"https://steemd.minnowsupportproject.org",timeLastResponse:now},
  {url:"https://steemd.privex.io",timeLastResponse:now},
  {url:"https://gtg.steem.house:8090",timeLastResponse:now}  
];
var id_rpc_node = 0;

console.log("we are inside");


$(function () {
  setApiNode();
  initConnectionSteemApi();
});


function initConnectionSteemApi(){
  steem.api.getCurrentMedianHistoryPrice(function(err, result){
    if (err || !result){
      handleErrorPrice(err);
      return;
    }
    
    steem_price = parseFloat(result.base.replace(" SBD",""))/parseFloat(result.quote.replace(" STEEM",""));
    console.log("steem_price: "+steem_price);
    
    steem.api.getRewardFund("post", function(err, result){    
      if (err || !result){
        handleErrorPrice(err);
        return;
      }
    
      reward_balance = parseFloat(result.reward_balance.replace(" STEEM",""));
      recent_claims = parseInt(result.recent_claims);
      console.log("reward_balance: "+reward_balance);
      console.log("recent_claims: "+recent_claims);
      
    });      
  });    
}
         
function check(){
  curators = {};
  responses = 0;

  var links = $('#posts').val().split('\n');
  links.forEach(function(link){
    console.log('checking link: '+link);
    var permlink = link.substr(link.lastIndexOf('/') + 1);
    var author = link.substring(link.lastIndexOf('@') + 1, link.lastIndexOf('/'));
    steem.api.getContent(author,permlink,function(err, result){
      votes = result.active_votes;
      for(var i=0;i<votes.length;i++){
        p = {
          author:author,
          permlink:permlink,
          link:link,
          percent: votes[i].percent,
          rshares: votes[i].rshares,
          time: votes[i].weight
        };
        c = votes[i].voter;
        if(!curators[c]){
          curators[c] = {};
          curators[c].votes = 0;
          curators[c].posts = [];
        }
        curators[c].votes++;
        curators[c].posts.push(p);          
      }
      
      responses++;
      if(responses >= links.length){
        var count = [];
        for(var c in curators){
          votes = curators[c].votes;
          if(!count[votes]){
            count[votes] = [];
          }
          count[votes].push(c);
        }
        
        $('#result').text('');        
        for(var i=count.length-1;i>0;i--){
          $('#result').append(htmlResultHeader(i));
          count[i].sort().forEach(function (c){
            $('#result').append(htmlResultItem(c , curators[c].posts));
          });          
        }        
      }
    });
  });
}

function htmlResultHeader(n){
  return '<div class="res-header">'+n+' votes</div>';
}

function htmlResultItem(user,posts){
  html_values = '';
  posts.forEach(function(p){
    html_values += '<div class="item-value">$'+rshares2sbd(p.rshares).toFixed(5)+'</div>';
  });

  return ''+
    '<div class="item1">'+
      '<div class="crop" style="background-image: url(https://steemitimages.com/u/'+user+'/avatar/small);"></div>'+
      '<div class="item-name">'+user+'</div>'+
      html_values+
    '</div>';
}       

function setApiNode(){
  var n = id_rpc_node;
  if(n >= rpc_nodes.length) return false;
  steem.api.setOptions({ transport: 'http', uri: rpc_nodes[n].url, url: rpc_nodes[n].url });
  console.log('RPC Node: '+rpc_nodes[n].url); 
  return true;
}

function rshares2sbd(rs){
  return rs*(reward_balance/recent_claims)*steem_price;
}

