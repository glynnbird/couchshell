# couchshell

```
   _____                 _      _____ _          _ _ 
  / ____|               | |    / ____| |        | | |
 | |     ___  _   _  ___| |__ | (___ | |__   ___| | |
 | |    / _ \| | | |/ __| '_ \ \___ \| '_ \ / _ \ | |
 | |___| (_) | |_| | (__| | | |____) | | | |  __/ | |
  \_____\___/ \__,_|\___|_| |_|_____/|_| |_|\___|_|_|
                                                     
```

Couchshell is a command-line shell utility that allows you to interact with a CouchDB/Cloudant interface as if it were a Unix file system.

* mkdir - create database
* rmdir - remove database
* cd - change database
* ls/ll - list contents of database or list of databases
* cat - show contents of document or datbase stats
* echo - create document
* rm - remove document
* cp - copy a document or database
* head - show first few documents from a database

## Installation

    npm install -g couchshell

## Define the URL of your CouchDB/Cloudant server

Set an environment variable called `COUCH_URL` which contains the URL of your CouchDB or Cloudant instance e.g.

    export COUCH_URL=http://127.0.0.1:5984

or 

    export COUCH_URL=https://myusername:mypassword@myhost.cloudant.com

## Starting couchshell

    $ couchshell
    Type "help" or press enter for a list of commands
    >>

You now have access to your CouchDB server as if is a file system with databases represented as directories at the root level and documents as files inside the directories.


## Create database (directory)

    >> mkdir mydb
  
## Change directory

We can deal with a database by using the `cd` shell commmand:

    >> cd mydb
    mydb >>
  
Or return back to the home directory with

    >> cd ..
    >>  

## View the contents of a directory

We can see the contents of a directory with `ls`:

    >> ls
    _replicator _users accidents anagrammer articles cache conference db10 feeds geoquiz geoquiz_stats houseprices
    >>

or `ll`:

    >> ll
    _replicator
    _users
    accidents
    anagrammer
    articles
    cache
    conference
    db10
    feeds
    geoquiz
    geoquiz_stats
    houseprices
    hp
    mydb
    nottage
    pt_test
    remote
    test
    >>

At the top level we see a list of databases. When we have `cd`'d to database, we see a list of documents:

    geoquiz >> ll
    _design/fetch
    afghanistan
    alabama
    alaska
    albania
    algeria
    angola
    antarctica
    argentina
    arizona
    geoquiz 
    >>

We can also add the starting letters of a document's id to narrow the list:

    geoquiz >> ll do
    dogger
    dominican republic
    dorset
    dover
    geoquiz >>

## Viewing the contents of a database

When at the top level, using `cat` shows a databases's stats:

    >> cat geoquiz
    {"db_name":"geoquiz","doc_count":292,"doc_del_count":2,"update_seq":296,"purge_seq":0,"compact_running":false,"disk_size":2682993,"data_size":2634563,"instance_start_time":"1427369661867062","disk_format_version":6,"committed_update_seq":296}
    >>

When inside a database, `cat` shows the contents of a document:

    geoquiz >> cat dover
    {"_id":"dover","_rev":"1-7ea98285628d4bb3203a0ef3b1f34247","type":"Feature","properties":{"name":"Dover","group":"Shipping Forecast"},"geometry":{"type":"Polygon","coordinates":[[[0.439453125,50.83369767098071],[1.58203125,50.233151832472245],[1.494140625,50.84757295365389],[1.7578125,50.94458443495011],[2.48291015625,51.08282186160978],[2.9443359375,51.28940590271679],[1.3842773437499998,51.26191485308451],[1.29638671875,51.12421275782688],[1.03271484375,51.069016659603896],[0.9667968749999999,50.93073802371819],[0.791015625,50.958426723359935],[0.439453125,50.83369767098071]]]}}
    geoquiz >>

## Creating data

This is where the anaology of directories & files --> databases & documents is stretched. We use the `echo` command to generate data:

    testdb >> echo '{"a":1,"b":2,"c":"three"}'
    {"ok":true,"id":"996dfcc55a3676485a6223b09d00b958","rev":"1-debc5c8de13e1f36787fe391da8191a6"}
    testdb >>

or we can specify the id by piping to a 'file':

    testdb >> echo '{"a":1,"b":2,"c":"three"}' > mydoc
    {"ok":true,"id":"mydoc","rev":"1-debc5c8de13e1f36787fe391da8191a6"}
    testdb >>
  
## Touching data

You can create a new empty document, or 'touch' an existing one (load it and save it) by using `touch`:

    test >> touch moo
    {"ok":true,"id":"moo","rev":"1-967a00dff5e02add41819138abb3284d"}
    test >> touch moo
    {"ok":true,"id":"moo","rev":"2-7051cbe5c8faecd085a3fa619e6e6337"}
    test >>
    
## Deleting data

We can remove documents with `rm`:

    testdb >> rm mydoc
    {"ok":true,"id":"mydoc","rev":"2-c1b6d2ae1a60056eac56f1f440b7b593"}
    testdb >> 

or remove whole directories with `rmdir`:

    >> rmdir test
    {"ok":true}

## Copying a document

When inside a directory (database), we can copy a document with:

    testdb >> cp doc1 doc2
    {"ok":true,"id":"doc2","rev":"1-fda016d0fc74921c9b324b7aff5cbbdb"}
     
If the destination document is already there, we will get an error:

    testdb >> cp doc1 doc2
    409: Document update conflict.

## Copying a database

When at the top of the directory tree, we can replicate one database to another with the `cp` commnand

    >> cp databasea databaseb
    Replication scheduled:
    {"ok":true,"id":"30990d73131ad3674d3d778dbb461d85","rev":"1-6bf28911ef8daa72ecc51762955e6f9a"}

Replication happens asynchronously. We can check on its progress by using `cat` with the name of the target database:

    >> cat databaseb
    {"db_name":"crimea","doc_count":18500,"doc_del_count":0,"update_seq":18500,"purge_seq":0,"compact_running":false,"disk_size":12021880,"data_size":11890503,"instance_start_time":"1427978103035439","disk_format_version":6,"committed_update_seq":18500}
    
We can even replicate to and from a remote URL:

    >> cp databasea https://myusername:mypassword@myhost.cloudant.com/databaseb
    Replication scheduled:
    {"ok":true,"id":"30990d73131ad3674d3d778dbb461d85","rev":"1-6bf28911ef8daa72ecc51762955e6f9a"}
    
## Showing first few documents from a database

When at the top of the directory tree, we can output the first ten of a database's documents with `head`:

    >> head geoquiz
    [{"id":"_design/fetch","key":"_design/fetch","value":{"rev":"1-a15cb9ce7b3a4466eb369f882fb0b717"}},{"id":"afghanistan","key":"afghanistan","value":{"rev":"1-9558a91d8b99d812baead834644dbb20"}},{"id":"alabama","key":"alabama","value":{"rev":"1-dda5ed5297b54d709d5946e1ca64f30a"}},{"id":"alaska","key":"alaska","value":{"rev":"1-aaac41905347745378f8b53d4cb4c407"}},{"id":"albania","key":"albania","value":{"rev":"1-594d450b3d155ca7a30e8fb097f4cba7"}},{"id":"algeria","key":"algeria","value":{"rev":"1-1a3a846e82373946eb4ef6066993441a"}},{"id":"angola","key":"angola","value":{"rev":"1-251dc285ef7c60330041350fae377047"}},{"id":"antarctica","key":"antarctica","value":{"rev":"1-eb7b0d1b313034977a266bda6bf3eb54"}},{"id":"argentina","key":"argentina","value":{"rev":"1-7c562dcca2e94e922ecf22e200adad0b"}},{"id":"arizona","key":"arizona","value":{"rev":"1-c02750010054f7ff3a0aa420747ef3c7"}}]


##  Showing the revision history of a document

When inside a database (directory), you can see a visualisation of the revision history with `tree`:

A document with only one revision  will simply show it's id and revision token:

    testdb >> tree 87c8882011c89970bbe077ac67003479
    id = 87c8882011c89970bbe077ac67003479
    └─ 1-e14063a7ba34a22b100284ce731ad6ac *

A document with many conflicts on revision 1 will look like this:

    testdb >> tree 87c8882011c89970bbe077ac67003479
    id = 87c8882011c89970bbe077ac67003479
    └─ 1
       ├─ 1-100785dab5598961c8588790a810d37c
       ├─ 1-1234cfba23d341a6d3916372a782fd65
       ├─ 1-16d159e554c289d5848a3ca8854f9807
       ├─ 1-1f10158068c458605d02ed0199ccd23b
       ├─ 1-45b83b90c5112878ad1a961b3e7ccaee
       ├─ 1-5e52a4558f111a53afe6ef72ee831af8
       ├─ 1-6a74408eb56ad564c1d461c97e3c47dc
       ├─ 1-6f49e763289e848f1650a94043a1e792
       ├─ 1-93b0bd6be8d346e28f95584a972c4e24
       └─ 1-94ec1c1571a5b00a5f0bf4121af1ddef *
       
And a more complicated revision history may look like this:

    testdb >> tree 87c8882011c89970bbe077ac67003479
    id = 87c8882011c89970bbe077ac67003479
    ├─ 1-46d69249075d3c7edebff00bb1eab65e
    ├─ 2-cc0b8b79af66fba84a8443484bff5160
    ├─ 3-52d91622d40f174894c567cc1fcee2e3
    ├─ 4
    │  ├─ 4-5c58ab6c4a15f5b8b880994fa52dfa68
    │  └─ 4-8171912e80397748fbde74cc09d42c6e
    ├─ 5-edec47733ea830362a5913b7f6312fe6
    └─ 6
       ├─ 6-5f24a47d9c6cbd78261830ef179aebfd
       └─ 6-f564b9850dca8e61019aeabdd5480f3f *
   
The winning revision is marked with an asterisk.

## Todo

* force rmdir to require confirmation before deleting a database