const storage = browser.storage.local;
const tabs = browser.tabs;
const path_to_storage_page = '../storage/storage.html';

function setup_click_action( currentUrl )
{
     document.getElementById('description').focus();

     document.getElementById('storage').addEventListener('click', () =>
     {
          window.close();
          window.open( path_to_storage_page );
     });

     document.getElementById('cancel').addEventListener('click', () =>
     {
          window.close();
     });

     document.getElementById('add').addEventListener('click', () =>
     {
          const bookmark_to_insert = {
               url: currentUrl,
               title: document.getElementById('title').value,
               description: document.getElementById('description').value,
               date : { 
                    added : new Date().toLocaleString(),
                    changed : ''
               }
          };

          storage.get().then(data =>
          {
               if (!data.bookmarks)
               {
                    storage.set(
                    {
                         bookmarks: [bookmark_to_insert]
                    });
                    return;
               }

               const indexBookmark = data.bookmarks.findIndex(
                    item => item['url'] === currentUrl
               );

               // edit bookmark which is already in the storage
               if (indexBookmark != -1)
               {
                    data.bookmarks[indexBookmark]['title'] = document.getElementById('title').value;
                    data.bookmarks[indexBookmark]['description'] = document.getElementById('description').value;
                    data.bookmarks[indexBookmark]['date']['changed'] = new Date().toLocaleString();
               }
               else // it's a new bookmark
               {
                    data.bookmarks.push(bookmark_to_insert);
               }
               storage.set(
               {
                    bookmarks: data.bookmarks
               });

               window.location.reload();
          });
     });
}

// setup popup 
tabs.query(
     {
          currentWindow: true,
          active: true
     })
     .then((tabs) =>
     {

          setup_click_action( tabs[0].url );

          document.getElementById('title').defaultValue = tabs[0].title;
          storage.get().then(data =>
          {
               if ( !data.bookmarks )
               {
                    console.warn( 'storage is empty' );
                    return;
               }

               const indexBookmark = data.bookmarks.findIndex(
                    item => item['url'] === tabs[0].url);

               let buttonSubmit = document.getElementById('add');
               let buttonReset = document.getElementById('cancel');

               if (indexBookmark == -1)
               {
                    buttonSubmit.firstChild.data = 'Add';
                    buttonReset.firstChild.data = 'Cancel'
               }
               else
               {
                    buttonSubmit.firstChild.data = 'Edit';
                    buttonReset.firstChild.data = 'Remove';
                    buttonReset.addEventListener('click', () =>
                    {
                         data.bookmarks.splice(indexBookmark, 1);
                         storage.set(
                         {
                              bookmarks: data.bookmarks
                         });
                    });
               }
          })
     }
);

