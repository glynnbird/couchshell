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
* touch - load and save a document
* pwd - show the current database
* tree - show revision history and conflicts from a document
* du - show disk space usage of a database
* fsck - remove conflicts from a document

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

## Removing conflicts from a document

We can delete all conflicting revisions from a document (other than the winning revision) using `fsck <id>`:
  
    mydb >> tree mydoc
    id = mydoc
    └─ 1
       ├─ 1-1a0f63dc5b1e38a31c3a42dbb4afe3db
       ├─ 1-5eb7c1177ad06bf192c3dacf776cf3d3
       ├─ 1-7c1dafbec62feefc2f0e875aea2f6093
       ├─ 1-94ec1c1571a5b00a5f0bf4121af1ddef
       ├─ 1-95630339bde96adda2be19207c4772c8
       ├─ 1-9d1d7a18212c0c74369208e4aef7fa13
       ├─ 1-d2701441808e0caee7c394d77fbe7550
       ├─ 1-da86decbdae0ef60ad41c33c12870860
       ├─ 1-e91608e02ae31b5c6085d5ca17d964e2
       └─ 1-f5401b77bb604d6f55c04a0e661f69d4 *
    mydb >> fsck mydoc [{"ok":true,"id":"mydoc","rev":"2-96d4749bff11e619f31c3918671ec072"},{"ok":true,"id":"mydoc","rev":"2-0720b0ca56a1918feb5fac5bc0f5f7f6"},{"ok":true,"id":"mydoc","rev":"2-41e157d902abb4a9a84e8fcd905b17da"},{"ok":true,"id":"mydoc","rev":"2-421cc57d13e5f922fcc91f52e0884d3b"},{"ok":true,"id":"mydoc","rev":"2-da7d32f6a0201bf1509632d0f4b58359"},{"ok":true,"id":"mydoc","rev":"2-ef061a6709fa93bbc92f07277b81990a"},{"ok":true,"id":"mydoc","rev":"2-558011a4162d26bdcec71166556627c6"},{"ok":true,"id":"mydoc","rev":"2-19ffd7f841ddf020b42151d17f0012cc"},{"ok":true,"id":"mydoc","rev":"2-4d8e91ebc73462334b69a76610264799"}]
    mydb >> tree mydoc
    id = mydoc
    └─ 1-f5401b77bb604d6f55c04a0e661f69d4 *
  
All of the conflicting revisions are deleted in a single bulk operation. You see the response to the bulk operation. 

If we want to keep a specific revision (that is not current winning revision), then we can do `fsck <id> <rev>`:
  
    mydb >> tree mydoc
    id = mydoc
    └─ 1
       ├─ 1-16d5fd150971e97f6adec5e17f515594
       ├─ 1-2d9097166eeaeffc5ae70346fea0b988
       ├─ 1-32616223ff8de17ee8a1afbcccc05e8e
       ├─ 1-36602b53bf2918b393b1bef3c7648767
       ├─ 1-49dedfaefc6f706b609bc75958499a13
       ├─ 1-94ec1c1571a5b00a5f0bf4121af1ddef
       ├─ 1-9e9b49aff3c1b99dcfa01e6292053aa9
       ├─ 1-a3eefcfb591f999b87284663a287d3b9
       ├─ 1-a7f639949923d35e26974b3b81522116
       └─ 1-a8f68832e5dd0acc1d24d099dceea335 *
    mydb >> fsck mydoc 1-999
    The revision 1-999 does not exist in the document.
    mydb >> fsck mydoc 1-a7f639949923d35e26974b3b81522116    [{"ok":true,"id":"mydoc","rev":"2-a10f20dc2f70275e85c36305086e0ce8"},{"ok":true,"id":"mydoc","rev":"2-5ab18477afda68b7320e490113d35e74"},{"ok":true,"id":"mydoc","rev":"2-ef061a6709fa93bbc92f07277b81990a"},{"ok":true,"id":"mydoc","rev":"2-8ad6479190c7144359198ac216215ef3"},{"ok":true,"id":"mydoc","rev":"2-c6ca34d99535e5c451752adae33a0336"},{"ok":true,"id":"mydoc","rev":"2-e5aa1fb11293c85c0f84d23e4a0c6ae0"},{"ok":true,"id":"mydoc","rev":"2-875565098342b16627e54b7cd6044818"},{"ok":true,"id":"mydoc","rev":"2-4b432cb9348e2e07c9165d10dbdb1139"},{"ok":true,"id":"mydoc","rev":"2-b9fbc1a19742fac04d1d98db95fb7b43"}]
    mydb >> tree mydoc
    id = mydoc
    └─ 1-a7f639949923d35e26974b3b81522116 *
    mydb >> 

## Showing the disk usage of a database

When at the top level, we can show the statistics of a database using `du <dbname>`:

    >> du ebooks    {"db_name":"ebooks","doc_count":41,"doc_del_count":0,"update_seq":41,"purge_seq":0,"compact_running":false,"disk_size":163944,"data_size":13856,"instance_start_time":"1445498614131939","disk_format_version":6,"committed_update_seq":41}

Similarly if we are inside a database, we can simply use `du`:

    >> cd ebooks
    ebooks >> du {"db_name":"ebooks","doc_count":41,"doc_del_count":0,"update_seq":41,"purge_seq":0,"compact_running":false,"disk_size":163944,"data_size":13856,"instance_start_time":"1445498614131939","disk_format_version":6,"committed_update_seq":41}

## Todo

* force rmdir to require confirmation before deleting a database