const storage = browser.storage.local;
const tabs = browser.tabs;
const path_to_storage_page = '../storage/storage.html';

function reload_values( switchToEdit = false )
{
     let caption = document.getElementById('container');
     let buttons = document.getElementById('popup_buttons');
     let cancel = document.getElementById('cancel');
     let add = document.getElementById('add');
     
     if ( switchToEdit )
     {
          caption.innerHTML = 'Edit bookmark';
          cancel.innerHTML = 'Remove';
          add.innerHTML = 'Edit';
          return;
     }
     
     caption.innerHTML = 'Add bookmark';
     cancel.innerHTML = 'Cancel';
     add.innerHTML = 'Add';
}

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
          if ( cancel = document.getElementById('cancel').innerHTML == 'Cancel' )
          {
               window.close();
          } else {
               reload_values();
          }
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
                    let switchValuesToEdit = true;
                    reload_values( switchValuesToEdit );
               }
               storage.set(
               {
                    bookmarks: data.bookmarks
               });

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
               let container = document.getElementById('container');
               let currentPosition = document.createElement('p');

               if (indexBookmark == -1)
               {
                    buttonSubmit.firstChild.data = 'Add';
                    buttonReset.firstChild.data = 'Cancel'
                    currentPosition.innerHTML = 'Add bookmark';
               }
               else
               {
                    currentPosition.innerHTML = 'Edit bookmark';
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
               // @todo: u should check that is this row can be locate after declare
               container.appendChild(currentPosition);
          })
     }
);

