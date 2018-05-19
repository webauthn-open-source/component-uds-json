## Install

Install using your `scm-config.json` file.

## About
This is a component for Simple Component Manager that implements a User Data Store (UDS). The User Data Store is persistent storage for User information and any associated information, such as Credentials.

Typically a UDS will be backed by some sort of database for persistent storage; however, this component is backed by TingoDB which uses local JSON files to store data. This is ideal for prototyping or demonstration servers since it doesn't require setting up a secondary server.

Note that TingoDB uses the exact same API as MongoDB (albeit, a slightly outdated version of the API). In theory, this would allow this module to quickly switch from using TingoDB to MongoDB without changing more than three or four lines of code within this component. That functionality is not currently implemented, but may be implemented in the future.

Documentation for this module can be found here (coming soon).