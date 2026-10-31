// The CFPlugIn entry Spotlight loads. It holds no document logic: FormaImportMetadata in SpotlightImporter.swift does the reading.
#include <CoreFoundation/CoreFoundation.h>
#include <CoreFoundation/CFPlugInCOM.h>
#include <CoreServices/CoreServices.h>

#define FORMA_FACTORY CFUUIDGetConstantUUIDWithBytes(NULL,0x84,0xC7,0x16,0x8F,0x3E,0x2F,0x49,0x12,0xBC,0x78,0xE6,0x0F,0x2E,0x3B,0x69,0xA3)
extern Boolean FormaImportMetadata(CFMutableDictionaryRef attributes,CFStringRef path);
typedef struct {MDImporterInterfaceStruct *interface;CFUUIDRef factory;UInt32 references;} Importer;
static HRESULT QueryInterface(void *self,REFIID iid,LPVOID *out);
static ULONG AddRef(void *self){return ++((Importer *)self)->references;}
static ULONG Release(void *self){
 Importer *importer=self;
 if(--importer->references)return importer->references;
 CFPlugInRemoveInstanceForFactory(importer->factory);CFRelease(importer->factory);free(importer);
 return 0;
}
static Boolean GetMetadataForFile(void *self,CFMutableDictionaryRef attributes,CFStringRef type,CFStringRef path){return FormaImportMetadata(attributes,path);}
static MDImporterInterfaceStruct Interface={NULL,QueryInterface,AddRef,Release,GetMetadataForFile};
static HRESULT QueryInterface(void *self,REFIID iid,LPVOID *out){
 CFUUIDRef requested=CFUUIDCreateFromUUIDBytes(kCFAllocatorDefault,iid);
 Boolean known=CFEqual(requested,kMDImporterInterfaceID)||CFEqual(requested,IUnknownUUID);
 CFRelease(requested);
 if(!known){*out=NULL;return E_NOINTERFACE;}
 AddRef(self);*out=self;return S_OK;
}
void *FormaImporterFactory(CFAllocatorRef allocator,CFUUIDRef type){
 if(!CFEqual(type,kMDImporterTypeID))return NULL;
 Importer *importer=malloc(sizeof(Importer));
 if(!importer)return NULL;
 importer->interface=&Interface;importer->factory=CFRetain(FORMA_FACTORY);importer->references=1;
 CFPlugInAddInstanceForFactory(FORMA_FACTORY);
 return importer;
}
